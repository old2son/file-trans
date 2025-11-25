'use client';

import { useEffect, useState, useRef } from 'react';

interface PDFViewport {
	width: number;
	height: number;
}

interface PDFPageProxy {
	getViewport: (params: { scale: number }) => PDFViewport;
	render: (params: { canvasContext: CanvasRenderingContext2D; viewport: PDFViewport }) => { promise: Promise<void> };
}

interface PDFDocumentProxy {
	getPage: (pageNumber: number) => Promise<PDFPageProxy>;
}

interface PDFJS {
	getDocument: (url: string) => { promise: Promise<PDFDocumentProxy> };
	GlobalWorkerOptions: { workerSrc: string };
}

declare global {
	interface Window {
		pdfjsLib?: PDFJS;
	}
}
export default function PdfCanvas({ propFile, onPdfCanvas }: { propFile?: File | null; onPdfCanvas: (str: HTMLCanvasElement | null) => void }) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	// const [isZoomed, setIsZoomed] = useState(false);

	const fileToBase64 = (file: File): Promise<string> => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.readAsDataURL(file);
			reader.onload = () => resolve(reader.result as string);
			reader.onerror = (error) => reject(error);
		});
	};

	const zoomImg = () => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const dataUrl = canvas.toDataURL('image/png');

		const imgWindow = window.open('');
		if (imgWindow) {
			imgWindow.document.write(`<img src="${dataUrl}" style="width:100%"/>`);
		}
	};

	useEffect(() => {
		if (!propFile) {
			onPdfCanvas(null); // 手动清除 canvas
			return;
		};

		async function loadPDF(PDFJS: PDFJS) {
			if (!propFile) return;

			const base64 = await fileToBase64(propFile);

			const pdf = await PDFJS.getDocument(base64).promise;
			const page = await pdf.getPage(1);

			const viewport = page.getViewport({ scale: 1.5 });

			const canvas = canvasRef.current!;
			const context = canvas.getContext('2d')!;

			canvas.width = viewport.width;
			canvas.height = viewport.height;

			await page.render({
				canvasContext: context,
				viewport,
			}).promise;

			onPdfCanvas(canvasRef.current);
			console.log('PDF 渲染成功');
		}

		// ⭐ 动态加载 public/pdfjs/pdf.js，不走 import
		const script = document.createElement('script');
		script.src = '/pdfjs/pdf.mjs';
		script.type = 'module';
		script.onload = () => {
			// window.PDFJS 就可以用了（PDF.js 自动挂在全局）
			const PDFJS = (window as unknown as { pdfjsLib: PDFJS }).pdfjsLib;

			// ⭐ 设置 worker 路径（public下）
			PDFJS.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.mjs';

			loadPDF(PDFJS);
		};
		document.body.appendChild(script);

		return () => {
			document.body.removeChild(script);
		};
	}, [propFile, onPdfCanvas]);

	if (!propFile) return;

	return (
		<div className="flex justify-center my-5">
			<canvas ref={canvasRef} className="w-[50vw] h-[75vw] cursor-pointer" onClick={zoomImg} />
		</div>
	);
}
