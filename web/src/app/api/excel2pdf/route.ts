import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { cwd } from 'process';

type CellValue = string | number | boolean | Date | null | undefined;
type ExcelRow = CellValue[];

export const runtime = 'nodejs';

export async function POST(req: Request) {
	try {
		const formData = await req.formData();
		const file = formData.get('file') as File;
		const fileName = encodeURIComponent(file?.name.split('.')[0]) || 'converted.pdf';

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
		const jsonData: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

		// ⬇️ 生成 PDF
		const doc = new PDFDocument();

		const chunks: Buffer[] = [];

		const pdfPromise = new Promise<Buffer>((resolve, reject) => {
			doc.on('data', (chunk) => chunks.push(chunk));
			doc.on('end', () => resolve(Buffer.concat(chunks)));
			doc.on('error', reject);
		});

		// 注册中文字体
		try {
			// 在 Windows 上
			// const fontPath = path.join(process.cwd(), 'public', 'fonts', 'DejaVuSans.ttf');
			// const fontPath = path.join(process.cwd(), 'public', 'fonts', 'MicrosoftYaHei.ttf');
			const fontPath = path.join(cwd(), 'public', 'fonts', 'NotoSansSC-Regular.ttf');
			if (fs.existsSync(fontPath)) {
				doc.registerFont('ChineseFont', fontPath);
				// .registerFont('wryh', `${process.cwd()}/public/fonts/MicrosoftYaHei.ttf`)
				// .registerFont('NotoSansSCRegular', `${process.cwd()}/public/fonts/NotoSansSC-Regular.ttf`);
				doc.font('ChineseFont');
			} 
		} catch (error) {
			console.warn('字体注册失败:', error);
		}

		// 添加内容到 PDF
		doc.fontSize(18).text('Excel 转 PDF 结果', { align: 'center' });
		doc.moveDown();

		let yPosition = 100;

		// 遍历所有行
		jsonData.forEach((row, index) => {
			// 检查是否需要新页面
			if (yPosition > 700) {
				// doc.addPage();
				yPosition = 50;
			}

			// row 是稀疏数组，需转密集数组处理 undefined
			let rowTextList = Array.from(row).map((cell: CellValue) => {
				return formatCellValue(cell);
			});
			rowTextList = rowTextList.filter(item => item !== '');
			const rowText = rowTextList.join(' | ').trim(); // 用空格分隔单元格内容

			// 第一行作为表头，加粗显示
			if (index === 0) {
				doc.fontSize(12).text(rowText, 50, yPosition);
			} else {
				doc.fontSize(10).text(rowText, 50);
				doc.moveDown();
			}

			// yPosition += 20;
		});

		doc.end();
		const pdfBuffer = await pdfPromise;
		return new NextResponse(new Uint8Array(pdfBuffer), {
			status: 200,
			headers: {
				'Content-Type': 'application/pdf',
				'Content-Disposition': `attachment; filename="${fileName}.pdf"`
			}
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
