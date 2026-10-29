import crypto from 'node:crypto';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { Readable, Transform } from 'node:stream';
import type { ReadableStream as NodeReadableStream } from 'node:stream/web';
import { NextResponse } from 'next/server';
import {
	JOB_ROOT,
	buildCompressArgs,
	ensureJobRoot,
	ffmpegVersion,
	probe,
	runFfmpeg,
	sweepOldJobs
} from '@/lib/ffmpeg';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** 单文件上限：8GB（基本都是没裁剪过的原片） */
const MAX_BYTES = 8 * 1024 * 1024 * 1024;
const GB = 1024 * 1024 * 1024;
/** 临时目录里同时要放输入和输出，按输入的两倍再加 512MB 预留 */
const DISK_MARGIN = 512 * 1024 * 1024;
const ALLOWED_EXT = ['.mp4', '.mov', '.mkv', '.avi', '.webm', '.m4v', '.wmv', '.flv', '.ts', '.mts'];
const ALLOWED_HEIGHTS = new Set([0, 480, 720, 1080, 1440, 2160]);

class FileTooLargeError extends Error {}

const QUALITY_PRESETS = {
	high: { crf: 20, preset: 'slow' },
	balanced: { crf: 26, preset: 'medium' },
	small: { crf: 30, preset: 'medium' }
} as const;

type QualityKey = keyof typeof QUALITY_PRESETS;

function isQualityKey(value: string | null): value is QualityKey {
	return value !== null && value in QUALITY_PRESETS;
}

function sanitizeName(raw: string | null): string {
	const base = path.basename(raw || 'video.mp4');
	const clean = base.replace(/[\\/:*?"<>|]+/g, '_').slice(0, 120);
	return clean || 'video.mp4';
}

function jsonError(message: string, status: number) {
	return NextResponse.json({ error: message }, { status });
}

type JobMeta = { name?: string; size?: number; originalSize?: number; createdAt?: number };

/** 列出保留期内仍未过期的压缩结果，刷新页面后仍能看到 */
export async function GET() {
	try {
		await ensureJobRoot();
		await sweepOldJobs();

		const entries = await fsp.readdir(JOB_ROOT, { withFileTypes: true });
		const items: { id: string; name: string; size: number; originalSize?: number; createdAt: number }[] = [];

		for (const entry of entries) {
			if (!entry.isDirectory()) continue;

			const dir = path.join(JOB_ROOT, entry.name);
			const meta = await fsp
				.readFile(path.join(dir, 'meta.json'), 'utf8')
				.then((raw) => JSON.parse(raw) as JobMeta)
				.catch(() => null);
			if (!meta?.name || !meta.size) continue;

			const output = await fsp.stat(path.join(dir, 'output.mp4')).catch(() => null);
			if (!output?.isFile()) continue;

			items.push({
				id: entry.name,
				name: meta.name,
				size: meta.size,
				originalSize: meta.originalSize,
				createdAt: meta.createdAt ?? output.mtimeMs
			});
		}

		items.sort((a, b) => b.createdAt - a.createdAt);
		return NextResponse.json({ items: items.slice(0, 30) });
	} catch (error) {
		return jsonError(error instanceof Error ? error.message : '读取列表失败', 500);
	}
}

export async function POST(req: Request) {
	let jobDir = '';

	try {
		await ffmpegVersion();
	} catch (error) {
		return jsonError(error instanceof Error ? error.message : '服务端未安装 ffmpeg', 503);
	}

	const url = new URL(req.url);
	const name = sanitizeName(url.searchParams.get('name'));
	const ext = path.extname(name).toLowerCase() || '.mp4';
	if (!ALLOWED_EXT.includes(ext)) {
		return jsonError(`暂不支持 ${ext} 格式，请上传 ${ALLOWED_EXT.join(' / ')}`, 415);
	}

	const qualityParam = url.searchParams.get('quality');
	const quality: QualityKey = isQualityKey(qualityParam) ? qualityParam : 'balanced';
	const heightParam = Number(url.searchParams.get('height') ?? 1080);
	const maxHeight = ALLOWED_HEIGHTS.has(heightParam) ? heightParam : 1080;

	const declaredLength = Number(req.headers.get('content-length') ?? 0);
	if (declaredLength > MAX_BYTES) {
		return jsonError(`文件超过 ${MAX_BYTES / GB}GB 上限，请先分段或裁剪`, 413);
	}
	if (!req.body) {
		return jsonError('没有收到文件内容', 400);
	}

	let inputPath = '';

	try {
		await ensureJobRoot();
		void sweepOldJobs();

		if (declaredLength > 0) {
			const free = await freeBytes();
			const needed = declaredLength * 2 + DISK_MARGIN;
			if (free !== null && free < needed) {
				return jsonError(
					`服务器临时空间不足：本次约需 ${(needed / GB).toFixed(1)}GB，当前可用 ${(free / GB).toFixed(1)}GB`,
					507
				);
			}
		}

		const id = crypto.randomUUID();
		jobDir = path.join(JOB_ROOT, id);
		await fsp.mkdir(jobDir, { recursive: true });

		inputPath = path.join(jobDir, `input${ext}`);
		// 直接落盘，避免 formData() 把整个视频读进内存
		await pipelineToFile(req.body, inputPath);

		const info = await probe(inputPath);
		const outputPath = path.join(jobDir, 'output.mp4');
		const outputName = `${path.basename(name, path.extname(name))}-compressed.mp4`;

		const args = buildCompressArgs(inputPath, outputPath, info, {
			crf: QUALITY_PRESETS[quality].crf,
			preset: QUALITY_PRESETS[quality].preset,
			maxShortSide: maxHeight
		});

		const encoder = new TextEncoder();
		const abort = new AbortController();

		const stream = new ReadableStream<Uint8Array>({
			async start(controller) {
				let closed = false;
				const send = (payload: unknown) => {
					if (closed) return;
					try {
						controller.enqueue(encoder.encode(`${JSON.stringify(payload)}\n`));
					} catch {
						closed = true;
					}
				};
				const finish = () => {
					if (closed) return;
					closed = true;
					try {
						controller.close();
					} catch {
						// 客户端已经断开
					}
				};
				const onClientGone = () => abort.abort();
				req.signal.addEventListener('abort', onClientGone, { once: true });

				try {
					send({
						type: 'meta',
						id,
						duration: info.duration,
						width: info.width,
						height: info.height,
						size: info.size
					});

					await runFfmpeg(args, {
						duration: info.duration,
						signal: abort.signal,
						// 按视频时长放宽：至少 30 分钟，最多 6 小时，避免 8GB 长片被误杀
						timeoutMs: Math.min(
							6 * 60 * 60 * 1000,
							Math.max(30 * 60 * 1000, Math.round(info.duration * 3000) + 10 * 60 * 1000)
						),
						onProgress: (progress) =>
							send({ type: 'progress', percent: progress.percent, speed: progress.speed, outTime: progress.outTime })
					});

					const stat = await fsp.stat(outputPath);
					await fsp.writeFile(
						path.join(jobDir, 'meta.json'),
						JSON.stringify({
							name: outputName,
							size: stat.size,
							originalSize: info.size,
							createdAt: Date.now()
						})
					);

					send({ type: 'done', id, name: outputName, size: stat.size, originalSize: info.size });
				} catch (error) {
					send({ type: 'error', message: error instanceof Error ? error.message : '压缩失败' });
				} finally {
					req.signal.removeEventListener('abort', onClientGone);
					await fsp.rm(inputPath, { force: true }).catch(() => undefined);
					finish();
				}
			},
			cancel() {
				abort.abort();
			}
		});

		return new Response(stream, {
			headers: {
				'Content-Type': 'application/x-ndjson; charset=utf-8',
				'Cache-Control': 'no-store, no-transform',
				'X-Accel-Buffering': 'no'
			}
		});
	} catch (error) {
		if (jobDir) {
			await fsp.rm(jobDir, { recursive: true, force: true }).catch(() => undefined);
		}
		if (error instanceof FileTooLargeError) {
			return jsonError(error.message, 413);
		}
		if ((error as NodeJS.ErrnoException).code === 'ENOSPC') {
			return jsonError('服务器磁盘空间不足，写入中断', 507);
		}
		if (req.signal.aborted) {
			return jsonError('上传中断，请重试', 400);
		}
		return jsonError(error instanceof Error ? error.message : '处理失败', 500);
	}
}

async function freeBytes(): Promise<number | null> {
	try {
		const stats = await fsp.statfs(JOB_ROOT);
		return Number(stats.bavail) * Number(stats.bsize);
	} catch {
		return null;
	}
}

async function pipelineToFile(body: ReadableStream<Uint8Array>, target: string): Promise<void> {
	const { pipeline } = await import('node:stream/promises');
	let received = 0;
	// 没有 Content-Length（chunked）时也要卡住上限，避免把磁盘写满
	const limiter = new Transform({
		transform(chunk: Buffer, _encoding, callback) {
			received += chunk.length;
			if (received > MAX_BYTES) {
				callback(new FileTooLargeError(`文件超过 ${MAX_BYTES / GB}GB 上限，请先分段或裁剪`));
				return;
			}
			callback(null, chunk);
		}
	});
	await pipeline(Readable.fromWeb(body as unknown as NodeReadableStream), limiter, fs.createWriteStream(target));
}
