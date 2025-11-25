import type { Metadata } from 'next';
import Pdf2ImageClient from './Pdf2ImageClient';

export const metadata: Metadata = {
	title: 'PDF 转 图片',
	description: 'PDFJS PDF 转 图片',
	keywords: ['PDFJS', 'PDF 转 图片', 'PDF to Image', '文件处理区'],
};

export default function Page() {
	return <Pdf2ImageClient />;
}

