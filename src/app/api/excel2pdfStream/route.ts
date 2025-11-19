/*
* 流式传输 Excel 转 PDF
* 获取文件大小后再进行流传输，直接流传输无法首次获知文件总大小
* 由于不是直接流传输处理，大文件转换并非最优选择
*/
import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { cwd } from 'process';
import { Readable } from 'stream';

type CellValue = string | number | boolean | Date | null | undefined;
type ExcelRow = CellValue[];

export const runtime = 'nodejs';

export async function POST(req: Request) {
	try {
		const formData = await req.formData();
		const file = formData.get('file') as File;
		const fileName = encodeURIComponent(file?.name.split('.')[0]) || 'converted';

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
		const jsonData: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

		// 临时路径
		const temp = path.join(os.tmpdir(), `${Date.now()}.pdf`);
		// 创建 PDF 文档
		const doc = new PDFDocument({
			autoFirstPage: true,
		});
		const writeStream = fs.createWriteStream(temp);
		doc.pipe(writeStream);

		// 注册中文字体
		try {
			const fontPath = path.join(cwd(), 'public', 'fonts', 'NotoSansSC-Regular.ttf');
			if (fs.existsSync(fontPath)) {
				doc.registerFont('ChineseFont', fontPath);
				doc.font('ChineseFont');
			}
		} catch (error) {
			console.warn('字体注册失败:', error);
		}

		// 写 PDF 内容
		doc.fontSize(18).text('Excel 转 PDF 结果', { align: 'center' });
		doc.moveDown();

		let yPosition = 100;

		jsonData.forEach((row, index) => {
			if (yPosition > 700) {
				doc.addPage();
				yPosition = 50;
			}

			const rowText = Array.from(row)
				.map((c) => formatCellValue(c))
				.filter(Boolean)
				.join(' | ')
				.trim();

			if (index === 0) {
				doc.fontSize(12).text(rowText, 50, yPosition);
			} else {
				doc.fontSize(10).text(rowText, 50, yPosition);
			}

			yPosition += 20;
		});

		// 必须 end 才会触发流式输出
		doc.end();

		// 等待写入完成
		await new Promise<void>((resolve) => writeStream.on('finish', () => resolve()));

		const stat = fs.statSync(temp);
		const totalSize = stat.size;

		// next.js 不接受 node 的 Readable 流，需转换为web stream
		const readStream = fs.createReadStream(temp);
		const webStream = nodeStreamToWeb(readStream);

		return new NextResponse(webStream, {
			status: 200,
			headers: {
				'Content-Type': 'application/pdf',
				'Content-Disposition': `attachment; filename="${fileName}.pdf"`,
				'Content-Length': String(totalSize),
			},
		});
	} catch (err) {
		console.error('转换失败:', err);
		return NextResponse.json({ error: '转换失败: ' + (err as Error).message }, { status: 500 });
	}
}

function formatCellValue(value: ExcelRow | CellValue): string {
	if (value === null || value === undefined) return '';
	if (value instanceof Date) return value.toLocaleDateString();
	return String(value);
}

function nodeStreamToWeb(stream: Readable): ReadableStream {
	return new ReadableStream({
		start(controller) {
			stream.on('data', (chunk) => controller.enqueue(chunk));
			stream.on('end', () => controller.close());
			stream.on('error', (err) => controller.error(err));
		},
		cancel() {
			stream.destroy();
		},
	});
}
