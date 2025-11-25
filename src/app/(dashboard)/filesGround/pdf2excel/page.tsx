import type { Metadata } from 'next';
import Pdf2ExcelClient from './Pdf2ExcelClient';

export const metadata: Metadata = {
	title: 'PDF 转 Excel',
	description: 'nodejs PDF 转 Excel',
	keywords: ['PDF 转 Excel', 'PDF to Excel', '文件处理区'],
};

export default function Page() {
	return <Pdf2ExcelClient />;
}

