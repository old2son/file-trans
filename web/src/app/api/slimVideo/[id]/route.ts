import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { NextResponse } from 'next/server';
import { JOB_ROOT } from '@/lib/ffmpeg';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type JobMeta = { name?: string; size?: number };

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
	const { id } = await context.params;
	if (!ID_PATTERN.test(id)) {
		return NextResponse.json({ error: '非法的任务 ID' }, { status: 400 });
	}

	const jobDir = path.join(JOB_ROOT, id);
	const outputPath = path.join(jobDir, 'output.mp4');

	const stat = await fsp.stat(outputPath).catch(() => null);
	if (!stat || !stat.isFile()) {
		return NextResponse.json({ error: '文件不存在或已过期，请重新压缩' }, { status: 404 });
	}

	const meta = await fsp
		.readFile(path.join(jobDir, 'meta.json'), 'utf8')
		.then((raw) => JSON.parse(raw) as JobMeta)
		.catch((): JobMeta => ({}));

	const fileName = meta.name || 'compressed.mp4';
	const body = Readable.toWeb(fs.createReadStream(outputPath)) as unknown as ReadableStream<Uint8Array>;

	return new Response(body, {
		headers: {
			'Content-Type': 'video/mp4',
			'Content-Length': String(stat.size),
			'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
			'Cache-Control': 'no-store'
		}
	});
}
