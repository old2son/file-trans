import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

// 必须开启 Node.js 请求体
export const runtime = 'nodejs';

export async function POST(req: Request) {
	try {
		const formData = await req.formData();
		const file = formData.get('file') as File;

		if (!file) {
			return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
		}

		// 转 Buffer
		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		// 解析 Excel
		const workbook = XLSX.read(buffer, { type: 'buffer' });
		const sheetName = workbook.SheetNames[0];
		const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
			header: 1,
		});

		console.log('excel 转 pdf 接收到的文件:', file);

		// ⬇️ 生成 PDF
		const fontPath = process.cwd() + '/public/fonts/palatino_bold.ttf';
		const doc = new PDFDocument({ font: '' });
		/* const doc = new PDFDocument({
			font: fontPath,
		}); */
		const chunks: Uint8Array[] = [];

		doc.on('data', (c) => chunks.push(c));
		doc.on('end', () => {});

		doc.font(fontPath);
		doc.fontSize(16).text('Excel 转 PDF', { align: 'center' });
		doc.moveDown();

		sheet.forEach((row: any) => {
			console.log(1231321)
			console.log(row)
			doc.fontSize(12).text('6666666');
		});

		doc.end();

		const pdfBuffer = Buffer.concat(chunks);

		return new NextResponse(pdfBuffer, {
			status: 200,
			headers: {
				'Content-Type': 'application/pdf',
				'Content-Disposition': 'attachment; filename="converted.pdf"',
			},
		});
	} catch (err) {
		console.error('转换失败:', err);
		return NextResponse.json({ error: '转换失败' }, { status: 500 });
	}
}
