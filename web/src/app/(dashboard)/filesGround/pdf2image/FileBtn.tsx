'use client';

import { useState, useCallback } from 'react';
import { openModal } from '@/components/GlobalModal';
import PdfCanvas from './PdfCanvas';

export default function FileBtn({ onFileMsg }: { onFileMsg: (msg: { name: string; size: number; [key: string]: unknown } | null) => void }) {
	const [file, setFile] = useState<File | null>(null);
	const [pdfCanvas, getPdfCanvas] = useState<HTMLCanvasElement | null>(null);
	const [allCanvases, setAllCanvases] = useState<HTMLCanvasElement[]>([]);
	const [ready, setReady] = useState(false);

	const handleTestModal = (content: string) => {
		openModal({
			content: content,
			showTitle: true,
			showCancel: true,
		});
	};

	function getFile(e: React.ChangeEvent<HTMLInputElement>) {
		const fileTg = e.target.files?.[0];

		if (!fileTg) return handleTestModal('请选择PDF文件');
		if (fileTg.type !== 'application/pdf') return handleTestModal('仅支持 PDF 格式的文件');

		setFile(fileTg);
		onFileMsg({ name: fileTg.name, size: fileTg.size });
		setReady(true);
		e.target.value = ''; // 同一文件不触发，需要重置
	}

	const clearFile = () => {
		setReady(false);
		setFile(null);
		onFileMsg(null);
		setAllCanvases([]);
	};

	const handleAllCanvases = useCallback((canvases: HTMLCanvasElement[]) => {
		setAllCanvases(canvases);
	}, []);

	function downloadImage() {
		if (!pdfCanvas) return;

		pdfCanvas.toBlob((blob) => {
			if (!blob) return;
			const url = URL.createObjectURL(blob);

			const link = document.createElement('a');
			link.href = url;
			link.download = 'pdf_page_1.png';
			link.click();

			URL.revokeObjectURL(url);
		}, 'image/png');
	}

	function downloadAllImages() {
		if (allCanvases.length === 0) return;

		allCanvases.forEach((canvas, index) => {
			canvas.toBlob((blob) => {
				if (!blob) return;
				const url = URL.createObjectURL(blob);

				const link = document.createElement('a');
				link.href = url;
				link.download = `pdf_page_${index + 1}.png`;
				link.click();

				URL.revokeObjectURL(url);
			}, 'image/png');
		});
	}

	function downloadMergedImage() {
		if (allCanvases.length === 0) return;

		// 计算合成图片的总高度
		const totalHeight = allCanvases.reduce((sum, canvas) => sum + canvas.height, 0);
		const maxWidth = Math.max(...allCanvases.map(canvas => canvas.width));

		// 创建新的 canvas 用于合成
		const mergedCanvas = document.createElement('canvas');
		mergedCanvas.width = maxWidth;
		mergedCanvas.height = totalHeight;

		const context = mergedCanvas.getContext('2d');
		if (!context) return;

		// 绘制所有页面到合成 canvas
		let currentY = 0;
		allCanvases.forEach(canvas => {
			context.drawImage(canvas, 0, currentY);
			currentY += canvas.height;
		});

		// 下载合成后的图片
		mergedCanvas.toBlob((blob) => {
			if (!blob) return;
			const url = URL.createObjectURL(blob);

			console.log(url);
			console.log(blob);

			const link = document.createElement('a');
			link.href = url;
			link.download = 'pdf_merged.png';
			link.click();

			URL.revokeObjectURL(url);
		}, 'image/png');
	}

	return (
		<form onSubmit={(e) => e.preventDefault()}>
			<div className={`${file ? 'fixed bottom-5 right-2' : 'relative flex justify-center'}`}>
				<label
					htmlFor="excel2pdf"
					className={`relative z-5 px-4 py-2 mt-0 rounded cursor-pointer text-center text-white bg-blue-500 ${
						file ? '' : 'block static w-3xs mt-2 '
					}`}
				>
					选择文件
				</label>

				<input
					type="file"
					id="excel2pdf"
					name="excel2pdf"
					accept="application/pdf"
					className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
					onChange={getFile}
				/>
			</div>

			<PdfCanvas onPdfCanvas={getPdfCanvas} onAllCanvases={handleAllCanvases} propFile={file} />

			<div className="grid grid-cols-2 gap-3 mt-2 px-2.5">
			{ready && pdfCanvas && (
				<button type="button" onClick={downloadImage} className="px-4 py-2 bg-red-900 text-white rounded cursor-pointer">
					下载当前页
				</button>
			)}

			{ready && pdfCanvas && allCanvases.length > 1 && (
				<button type="button" onClick={downloadAllImages} className="px-4 py-2 bg-red-800 text-white rounded cursor-pointer">
					下载所有页
				</button>
			)}

			{ready && pdfCanvas && allCanvases.length > 1 && (
				<button type="button" onClick={downloadMergedImage} className="px-4 py-2 bg-red-700 text-white rounded cursor-pointer">
					下载合成页
				</button>
			)}

			{ready && pdfCanvas && (
				<button type="button" onClick={clearFile} className="px-4 py-2 bg-red-900 text-white rounded cursor-pointer">
					清除文件
				</button>
			)}
		</div>
		</form>
	);
}
