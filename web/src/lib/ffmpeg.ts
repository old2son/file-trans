import { spawn, execFile } from 'node:child_process';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

/**
 * 服务端 FFmpeg 工具集。
 * 只能在 Node 环境（route handler / 脚本）里引用，不要被客户端组件 import。
 */

/** 任务产物目录：默认在系统临时目录，可用 SLIM_VIDEO_JOB_DIR 指到大容量磁盘 */
export const JOB_ROOT = process.env.SLIM_VIDEO_JOB_DIR
	? path.resolve(process.env.SLIM_VIDEO_JOB_DIR)
	: path.join(os.tmpdir(), 'file-transform-jobs');
export const JOB_TTL_MS = 60 * 60 * 1000;

export type MediaInfo = {
	/** 秒，探测不到时为 0 */
	duration: number;
	/** 字节 */
	size: number;
	width: number;
	height: number;
	hasAudio: boolean;
};

export type CompressOptions = {
	crf: number;
	preset: string;
	/** 短边上限，0 表示不缩放 */
	maxShortSide: number;
};

function unixCandidates() {
	return ['/usr/bin/ffmpeg', '/usr/local/bin/ffmpeg', '/opt/homebrew/bin/ffmpeg'];
}

function winCandidates() {
	return [
		'C:\\ffmpeg\\bin\\ffmpeg.exe',
		process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'ffmpeg', 'ffmpeg.exe') : '',
		process.env.LOCALAPPDATA
			? path.join(process.env.LOCALAPPDATA, 'Microsoft', 'WinGet', 'Links', 'ffmpeg.exe')
			: '',
		process.env.ProgramData ? path.join(process.env.ProgramData, 'chocolatey', 'bin', 'ffmpeg.exe') : '',
		process.env.USERPROFILE ? path.join(process.env.USERPROFILE, 'scoop', 'shims', 'ffmpeg.exe') : ''
	].filter(Boolean);
}

/** 依次尝试 FFMPEG_PATH、常见安装位置，最后交给 PATH 查找 */
export function resolveFfmpeg(): string {
	const explicit = process.env.FFMPEG_PATH;
	if (explicit && fs.existsSync(explicit)) return explicit;

	const candidates = process.platform === 'win32' ? winCandidates() : unixCandidates();
	for (const candidate of candidates) {
		if (candidate && fs.existsSync(candidate)) return candidate;
	}
	return 'ffmpeg';
}

/** 优先用 ffmpeg 同目录下的 ffprobe，再退化为 PATH */
export function resolveFfprobe(): string {
	const explicit = process.env.FFPROBE_PATH;
	if (explicit && fs.existsSync(explicit)) return explicit;

	const ffmpeg = resolveFfmpeg();
	if (path.isAbsolute(ffmpeg)) {
		const sibling = path.join(path.dirname(ffmpeg), process.platform === 'win32' ? 'ffprobe.exe' : 'ffprobe');
		if (fs.existsSync(sibling)) return sibling;
	}
	return 'ffprobe';
}

let versionCache: string | null = null;

/** 启动前先确认 ffmpeg 可用，避免让用户白传几百 MB 才报错 */
export function ffmpegVersion(): Promise<string> {
	if (versionCache) return Promise.resolve(versionCache);

	return new Promise((resolve, reject) => {
		execFile(
			resolveFfmpeg(),
			['-hide_banner', '-version'],
			{ windowsHide: true, timeout: 5000, encoding: 'utf8' },
			(err, stdout) => {
				if (err) {
					reject(new Error('服务器上找不到 ffmpeg，请先安装 FFmpeg 或配置 FFMPEG_PATH 环境变量'));
					return;
				}
				versionCache = String(stdout).split('\n')[0]?.trim() || 'ffmpeg';
				resolve(versionCache);
			}
		);
	});
}

type ProbeStream = { codec_type?: string; width?: number; height?: number };
type ProbeResult = {
	format?: { duration?: string; size?: string };
	streams?: ProbeStream[];
};

export function probe(input: string): Promise<MediaInfo> {
	return new Promise((resolve, reject) => {
		execFile(
			resolveFfprobe(),
			['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', input],
			{ windowsHide: true, timeout: 20000, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 },
			(err, stdout) => {
				if (err) {
					reject(new Error('无法读取视频信息，文件可能损坏或格式不受支持'));
					return;
				}
				try {
					const data = JSON.parse(String(stdout)) as ProbeResult;
					const streams = data.streams ?? [];
					const video = streams.find((stream) => stream.codec_type === 'video');
					if (!video) {
						reject(new Error('文件里没有视频轨道'));
						return;
					}
					resolve({
						duration: Number(data.format?.duration ?? 0) || 0,
						size: Number(data.format?.size ?? 0) || 0,
						width: video.width ?? 0,
						height: video.height ?? 0,
						hasAudio: streams.some((stream) => stream.codec_type === 'audio')
					});
				} catch {
					reject(new Error('解析 ffprobe 输出失败'));
				}
			}
		);
	});
}

export type ProgressPayload = { percent: number; speed: string; outTime: number };

export type RunOptions = {
	duration?: number;
	onProgress?: (payload: ProgressPayload) => void;
	signal?: AbortSignal;
	timeoutMs?: number;
};

/**
 * 运行 ffmpeg，并通过 `-progress pipe:1` 解析进度。
 * 不使用 shell，避免 Windows 下的引号/路径问题。
 */
export function runFfmpeg(args: string[], options: RunOptions = {}): Promise<void> {
	return new Promise((resolve, reject) => {
		let settled = false;
		let stderr = '';
		let stdoutBuffer = '';
		let speed = '';
		let outTime = 0;
		let timer: ReturnType<typeof setTimeout> | undefined;

		const child = spawn(resolveFfmpeg(), args, { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });

		const cleanup = () => {
			if (timer) clearTimeout(timer);
			options.signal?.removeEventListener('abort', onAbort);
		};
		const fail = (error: Error) => {
			if (settled) return;
			settled = true;
			cleanup();
			reject(error);
		};
		const done = () => {
			if (settled) return;
			settled = true;
			cleanup();
			resolve();
		};
		const onAbort = () => {
			child.kill('SIGKILL');
			fail(new Error('任务已取消'));
		};

		if (options.signal?.aborted) {
			child.kill('SIGKILL');
			fail(new Error('任务已取消'));
			return;
		}
		options.signal?.addEventListener('abort', onAbort, { once: true });

		if (options.timeoutMs) {
			timer = setTimeout(() => {
				child.kill('SIGKILL');
				fail(new Error('处理超时，请换更短的视频或降低质量重试'));
			}, options.timeoutMs);
		}

		child.stdout?.setEncoding('utf8');
		child.stdout?.on('data', (chunk: string) => {
			stdoutBuffer += chunk;
			let index = stdoutBuffer.indexOf('\n');
			while (index >= 0) {
				const line = stdoutBuffer.slice(0, index).trim();
				stdoutBuffer = stdoutBuffer.slice(index + 1);
				const separator = line.indexOf('=');
				if (separator > 0) {
					const key = line.slice(0, separator);
					const value = line.slice(separator + 1);

					if (key === 'out_time_us' || key === 'out_time_ms') {
						// 注意：ffmpeg 的 out_time_ms 实际也是微秒，两个键会一起输出，取哪个都一样
						const microseconds = Number(value);
						if (Number.isFinite(microseconds)) outTime = microseconds / 1_000_000;
					} else if (key === 'speed') {
						speed = value.trim();
					} else if (key === 'progress') {
						// 一个 progress 块结束时才上报，这样百分比和速度是同一拍的数据
						const percent = options.duration && options.duration > 0
							? Math.min(99, (outTime / options.duration) * 100)
							: 0;
						options.onProgress?.({ percent, speed, outTime });
					}
				}
				index = stdoutBuffer.indexOf('\n');
			}
		});

		child.stderr?.setEncoding('utf8');
		child.stderr?.on('data', (chunk: string) => {
			stderr = (stderr + chunk).slice(-4000);
		});

		child.on('error', (error) => {
			const code = (error as NodeJS.ErrnoException).code;
			if (code === 'ENOENT') {
				fail(new Error('服务器上找不到 ffmpeg，请先安装 FFmpeg 或配置 FFMPEG_PATH 环境变量'));
				return;
			}
			fail(new Error(`无法启动 ffmpeg：${error.message}`));
		});

		child.on('close', (code) => {
			if (code === 0) {
				done();
				return;
			}
			fail(new Error(`ffmpeg 退出码 ${code}${stderr ? `：${stderr.trim()}` : ''}`));
		});
	});
}

/**
 * 按短边上限等比缩放，并保证宽高为偶数（libx264 + yuv420p 要求）。
 * 短边对应“720p / 1080p”里的数字：1920x1080 选 720 得到 1280x720，竖屏 1080x1920 选 1080 则保持原样。
 */
export function scaledSize(info: MediaInfo, maxShortSide: number): { width: number; height: number } | null {
	if (!maxShortSide || !info.width || !info.height) return null;

	const shortest = Math.min(info.width, info.height);
	if (shortest <= maxShortSide) return null;

	const ratio = maxShortSide / shortest;
	const width = Math.max(2, Math.round((info.width * ratio) / 2) * 2);
	const height = Math.max(2, Math.round((info.height * ratio) / 2) * 2);
	return { width, height };
}

export function buildCompressArgs(input: string, output: string, info: MediaInfo, options: CompressOptions): string[] {
	const size = scaledSize(info, options.maxShortSide);
	const args = [
		'-hide_banner',
		'-loglevel',
		'error',
		'-y',
		'-i',
		input,
		'-map',
		'0:v:0',
		'-map',
		'0:a?',
		'-c:v',
		'libx264',
		'-preset',
		options.preset,
		'-crf',
		String(options.crf),
		'-pix_fmt',
		'yuv420p'
	];

	if (size) {
		args.push('-vf', `scale=${size.width}:${size.height}`);
	}

	args.push('-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', '-progress', 'pipe:1', '-nostats', output);
	return args;
}

export async function ensureJobRoot(): Promise<void> {
	await fsp.mkdir(JOB_ROOT, { recursive: true });
}

/** 清理超过 TTL 的任务目录，避免临时目录越积越大 */
export async function sweepOldJobs(ttl = JOB_TTL_MS): Promise<void> {
	try {
		const entries = await fsp.readdir(JOB_ROOT, { withFileTypes: true });
		console.log('清理超过 TTL 的任务目录：', entries);
		const now = Date.now();
		await Promise.all(
			entries
				.filter((entry) => entry.isDirectory())
				.map(async (entry) => {
					const target = path.join(JOB_ROOT, entry.name);
					const stat = await fsp.stat(target).catch(() => null);
					if (stat && now - stat.mtimeMs > ttl) {
						await fsp.rm(target, { recursive: true, force: true }).catch(() => undefined);
					}
				})
		);
	} catch {
		// 目录不存在等情况直接忽略
	}
}
