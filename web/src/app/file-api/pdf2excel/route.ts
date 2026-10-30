import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * PDF 转 Excel 的同源代理。
 * 浏览器只访问 /file-api/pdf2excel，由 Next 服务端转发给 Python（FastAPI）。
 * 好处：不跨域、不依赖 NEXT_PUBLIC_API_URL、不用给 nginx 加新前缀。
 */
const DEFAULT_BACKEND = 'http://127.0.0.1:4000';
const TIMEOUT_MS = 120 * 1000;
const MAX_BYTES = 50 * 1024 * 1024;

export async function POST(req: Request) {
	const contentType = req.headers.get('content-type') ?? '';
	if (!contentType.startsWith('multipart/form-data')) {
		return NextResponse.json({ detail: '请用 multipart/form-data 上传 PDF 文件' }, { status: 400 });
	}

	const declared = Number(req.headers.get('content-length') ?? 0);
	if (declared > MAX_BYTES) {
		return NextResponse.json({ detail: '文件超过 50MB，请拆分后再试' }, { status: 413 });
	}
	if (!req.body) {
		return NextResponse.json({ detail: '没有收到文件内容' }, { status: 400 });
	}

	// 每次请求读取，改环境变量后重启进程即可，不用重新构建
	const backend = process.env.PDF2EXCEL_API ?? DEFAULT_BACKEND;

	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

	// 原样转发 multipart，保留 boundary，避免把整个 PDF 读进内存
	const init: RequestInit & { duplex: 'half' } = {
		method: 'POST',
		body: req.body,
		headers: { 'content-type': contentType },
		duplex: 'half',
		signal: controller.signal
	};

	try {
		const upstream = await fetch(`${backend}/api/PDF2Excel`, init);
		const headers = new Headers({
			'content-type': upstream.headers.get('content-type') ?? 'application/octet-stream',
			'cache-control': 'no-store'
		});
		const disposition = upstream.headers.get('content-disposition');
		if (disposition) headers.set('content-disposition', disposition);

		return new Response(upstream.body, { status: upstream.status, headers });
	} catch (error) {
		const aborted = controller.signal.aborted;
		console.error('PDF2Excel 代理失败:', error);
		return NextResponse.json(
			{ detail: aborted ? '转换超时，请稍后重试' : `无法连接转换服务（${backend}），请确认 Python 服务已启动` },
			{ status: 504 }
		);
	} finally {
		clearTimeout(timer);
	}
}
