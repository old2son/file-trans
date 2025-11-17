import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { cwd } from 'process';

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
		const worksheet = workbook.Sheets[sheetName];

		// 转换为 JSON 格式
		const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

		// ⬇️ 生成 PDF
		const doc = new PDFDocument();

		const chunks: Buffer[] = [];

		const pdfPromise = new Promise<Buffer>((resolve, reject) => {
			doc.on('data', (chunk) => chunks.push(chunk));
			doc.on('end', () => resolve(Buffer.concat(chunks)));
			doc.on('error', reject);
		});

		// 注册中文字体（使用系统字体或自定义字体）
		// 方法1：使用系统字体（如果部署环境支持）
		try {
			// 在 Windows 上
			// const fontPath = path.join('C:', 'Windows', 'Fonts', 'simsun.ttc');
			// const fontPath = path.join(process.cwd(), 'public', 'fonts', 'DejaVuSans.ttf');
			// const fontPath = path.join(process.cwd(), 'public', 'fonts', 'MicrosoftYaHei.ttf');
			const fontPath = path.join(process.cwd(), 'public', 'fonts', 'NotoSansSC-Regular.ttf');
			console.log(1111111)
			console.log(fontPath)
			if (fs.existsSync(fontPath)) {
				doc.registerFont('ChineseFont', fontPath);
				// .registerFont('wryh', `${process.cwd()}/public/fonts/MicrosoftYaHei.ttf`)
				// .registerFont('NotoSansSCRegular', `${process.cwd()}/public/fonts/NotoSansSC-Regular.ttf`);
				doc.font('ChineseFont');
			} 
			else {
				// 在 Linux 上尝试其他字体
				// const linuxFontPath = '/usr/share/fonts/truetype/droid/DroidSansFallbackFull.ttf';
				// if (fs.existsSync(linuxFontPath)) {
				// 	doc.registerFont('ChineseFont', linuxFontPath);
				// 	doc.font('ChineseFont');
				// } else {
				// 	console.warn('未找到中文字体，使用默认字体');
				// }

				console.warn('未找到中文字体，使用默认字体');

			}
		} catch (error) {
			console.warn('字体注册失败:', error);
		}

		// 添加内容到 PDF
		doc.fontSize(18).text('Excel 转 PDF 结果', { align: 'center' });
		doc.moveDown();

		let yPosition = 100;

		// 遍历所有行
		jsonData.forEach((row: any, index: number) => {
			// 检查是否需要新页面
			if (yPosition > 700) {
				doc.addPage();
				yPosition = 50;
			}

			const rowText = Array.isArray(row)
				? row.map((cell) => formatCellValue(cell)).join(' | ')
				: formatCellValue(row);

			// 第一行作为表头，加粗显示
			if (index === 0) {
				doc.fontSize(12).text(rowText, 50, yPosition);
			} else {
				doc.fontSize(10).text(rowText, 50, yPosition);
			}

			yPosition += 20;
		});

		doc.end();
		const pdfBuffer = await pdfPromise;

		return new NextResponse(pdfBuffer, {
			status: 200,
			headers: {
				'Content-Type': 'application/pdf',
				'Content-Disposition': 'attachment; filename="converted.pdf"'
			}
		});
	} catch (err) {
		console.error('转换失败:', err);
		return NextResponse.json({ error: '转换失败: ' + (err as Error).message }, { status: 500 });
	}
}

function formatCellValue(value: any): string {
	if (value === null || value === undefined) return '';
	if (value instanceof Date) return value.toLocaleDateString();
	return String(value);
}
