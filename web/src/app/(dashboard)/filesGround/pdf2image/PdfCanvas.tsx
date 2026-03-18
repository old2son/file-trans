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
	numPages: number;
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
export default function PdfCanvas({
	propFile,
	onPdfCanvas,
	onAllCanvases
}: {
	propFile?: File | null;
	onPdfCanvas: (str: HTMLCanvasElement | null) => void;
	onAllCanvases?: (canvases: HTMLCanvasElement[]) => void;
}) {
	const canvasContainerRef = useRef<HTMLDivElement>(null);
	const [canvasElements, setCanvasElements] = useState<HTMLCanvasElement[]>([]);

	const fileToBase64 = (file: File): Promise<string> => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.readAsDataURL(file);
			reader.onload = () => resolve(reader.result as string);
			reader.onerror = (error) => reject(error);
		});
	};

	const zoomImg = (canvas: HTMLCanvasElement) => {
		if (!canvas) return;

		const dataUrl = canvas.toDataURL('image/png');

		const imgWindow = window.open('');
		if (imgWindow) {
			const img = imgWindow.document.createElement('img');
			img.src = dataUrl;
			img.style.width = '100%';
			imgWindow.document.body.appendChild(img);
		}
	};

	useEffect(() => {
		if (!propFile) {
			// 微任务
			queueMicrotask(() => {
				setCanvasElements([]);
				onPdfCanvas(null);
				onAllCanvases?.([]);
			});
			return;
		}

		async function loadPDF(PDFJS: PDFJS) {
			if (!propFile || !canvasContainerRef.current) return;

			console.log(propFile);
			const base64 = await fileToBase64(propFile);

			const pdf = await PDFJS.getDocument(base64).promise;
			const numPages = pdf.numPages;
			const canvases: HTMLCanvasElement[] = [];

			// 清空容器
			canvasContainerRef.current.innerHTML = '';

			// 渲染每一页
			for (let pageNum = 1; pageNum <= numPages; pageNum++) {
				const page = await pdf.getPage(pageNum);
				const viewport = page.getViewport({ scale: 1.5 });

				// 创建新的 canvas 元素
				const canvas = document.createElement('canvas');
				canvas.className = 'w-[50vw] h-[75vw] cursor-pointer shadow-md my-2';
				canvas.width = viewport.width;
				canvas.height = viewport.height;

				// 添加点击事件
				canvas.addEventListener('click', () => zoomImg(canvas));

				// 添加到容器
				canvasContainerRef.current.appendChild(canvas);

				// 渲染页面
				const context = canvas.getContext('2d')!;
				await page.render({
					canvasContext: context,
					viewport
				}).promise;

				canvases.push(canvas);
			}

			// 使用 Promise.resolve 避免同步调用 setState 导致的级联渲染
			Promise.resolve().then(() => {
				setCanvasElements(canvases);
				onPdfCanvas(canvases[0] || null); // 只传递第一个 canvas 给父组件
				onAllCanvases?.(canvases); // 传递所有 canvas 给父组件
				console.log('PDF 渲染成功，共', numPages, '页');
			});
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
	}, [propFile, onPdfCanvas, onAllCanvases]);

	if (!propFile) return;

	return (
		<div className="flex flex-col items-center my-5" ref={canvasContainerRef}>
			{/*  canvases will be dynamically added here  */}
		</div>
	);
}
