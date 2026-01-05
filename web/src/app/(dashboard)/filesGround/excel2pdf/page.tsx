import type { Metadata } from 'next';
import Excel2PdfClient from './Excel2PdfClient';

export const metadata: Metadata = {
	title: 'Excel 转 PDF',
	description: 'nodejs Excel 转 PDF',
	keywords: ['Excel 转 PDF', 'Excel to PDF', '文件处理区'],
};

export default function Page() {
	return <Excel2PdfClient />;
}
