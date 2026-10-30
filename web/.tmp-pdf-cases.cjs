const fs = require('node:fs');
const path = require('node:path');
const PDFDocument = require('pdfkit');

const dir = process.env.TEMP || '/tmp';

function make(name, draw) {
	const file = path.join(dir, name);
	const doc = new PDFDocument({ size: 'A4', margin: 50 });
	doc.pipe(fs.createWriteStream(file));
	draw(doc);
	doc.end();
	return file;
}

const rows = [
	['Name', 'Age', 'City'],
	['Alice', '28', 'Beijing'],
	['Bob', '34', 'Shanghai']
];

// A. 有框线的标准表格
const ruled = make('t-ruled.pdf', (doc) => {
	const widths = [120, 80, 120];
	const h = 24;
	const x0 = 50;
	const y0 = 60;
	rows.forEach((row, r) => {
		let x = x0;
		row.forEach((cell, c) => {
			doc.rect(x, y0 + r * h, widths[c], h).stroke();
			doc.text(cell, x + 8, y0 + r * h + 7, { width: widths[c] - 16 });
			x += widths[c];
		});
	});
});

// B. 无框线，但列用固定 x 坐标对齐（很常见的 Word/Excel 导出样式）
const borderless = make('t-borderless.pdf', (doc) => {
	rows.forEach((row, r) => {
		const y = 60 + r * 24;
		doc.text(row[0], 50, y, { width: 120 });
		doc.text(row[1], 180, y, { width: 80 });
		doc.text(row[2], 270, y, { width: 120 });
	});
});

// C. 纯图片：模拟扫描件（没有文字层）
const imageOnly = make('t-image.pdf', (doc) => {
	doc.image(path.join(__dirname, 'public', 'images', 'catMoon.jpg'), 50, 60, { width: 400 });
});

console.log(JSON.stringify({ ruled, borderless, imageOnly }));
