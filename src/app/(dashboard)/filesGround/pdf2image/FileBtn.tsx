'use client';

import { useState } from 'react';
import { openModal } from '@/components/GlobalModal';
import PdfCanvas from './PdfCanvas';

export default function FileBtn({ onFileMsg }: { onFileMsg: (msg: { name: string; size: number; [key: string]: unknown } | null) => void }) {
	const [file, setFile] = useState<File | null>(null);
	const [pdfCanvas, getPdfCanvas] = useState<HTMLCanvasElement | null>(null);
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
	};

	function downloadImage() {
		if (!pdfCanvas) return;

		pdfCanvas.toBlob((blob) => {
			if (!blob) return;
			const url = URL.createObjectURL(blob);

			const link = document.createElement('a');
			link.href = url;
			link.download = 'pdf_page.png';
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

			<PdfCanvas onPdfCanvas={getPdfCanvas} propFile={file} />

			<div className="grid grid-cols-2 gap-3 mt-2 px-2.5">
				{ready && pdfCanvas && (
					<button type="button" onClick={downloadImage} className="px-4 py-2 bg-red-900 text-white rounded cursor-pointer">
						下载图片
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
