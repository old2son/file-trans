'use client';

import { useRef, useState } from 'react';
import { openModal } from '@/components/GlobalModal';

export default function FileBtn({
	onProgress,
	onFileMsg,
}: {
	onProgress: (p: number) => void;
	onFileMsg: (msg: { name: string; size: number; [key: string]: unknown } | null) => void;
}) {
	const [file, setFile] = useState<File | null>(null);
	const [showConvertBtn, setShowConvertBtn] = useState(false);
	const [readyToDownload, setReadyToDownload] = useState(false);
	const blobBody = useRef<Blob | null>(null);

	const handleTestModal = (content: string) => {
		openModal({
			content: content,
			showTitle: true,
			showCancel: true,
		});
	};

	function getFile(e: React.ChangeEvent<HTMLInputElement>) {
		const fileTg = e.target.files?.[0];

		if (!fileTg) return handleTestModal('请选择文件');
		if (fileTg.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') return handleTestModal('仅支持 Excel 格式的文件');

		setFile(fileTg);
		onFileMsg({ name: fileTg.name, size: fileTg.size });
		setShowConvertBtn(true);
		setReadyToDownload(false);
		onProgress(0);
	}

	const clearFile = () => {
		setFile(null);
		onFileMsg(null);
		setShowConvertBtn(false);
		setReadyToDownload(false);
		onProgress(0);
	};

	async function convert() {
		if (!file) return handleTestModal('请选择文件');

		const form = new FormData();
		form.append('file', file);

		const res = await fetch('/api/excel2pdf', {
			method: 'POST',
			body: form,
		});

		if (res.status !== 200) { 
			return handleTestModal('转换失败');
		}

		blobBody.current = await res.blob();
		downFile();
	}

	async function convertStream() {
		if (!file) return alert('请先选择文件');

		const form = new FormData();
		form.append('file', file);

		const res = await fetch('/api/excel2pdfStream', {
			method: 'POST',
			body: form,
		});

		if (res.status !== 200) { 
			return handleTestModal('转换失败');
		}

		const total = Number(res.headers.get('Content-Length'));
		let loaded = 0;
		onProgress(0);

		const reader = res.body!.getReader();

		const stream = new ReadableStream({
			start(controller) {
				function pump() {
					reader.read().then(({ done, value }) => {
						if (done) {
							onProgress(100);
							controller.close();
							return;
						}

						loaded += value.length;
						onProgress(loaded / total);
						controller.enqueue(value);
						pump();
					});
				}
				pump();
			},
		});

		blobBody.current = await new Response(stream).blob();
		setReadyToDownload(true);
	}

	function downFile() {
		if (!file) return alert('请先选择文件');
		if (!blobBody.current) return alert('请先转换文件');

		const url = URL.createObjectURL(blobBody.current);
		const a = document.createElement('a');

		a.href = url;
		a.download = file.name.replace(/\.(xls|xlsx)$/, '.pdf');
		a.click();

		URL.revokeObjectURL(url);
		a.remove();
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
					accept=".xls,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
					className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
					onChange={getFile}
				/>
			</div>

			<div className="grid grid-cols-2 gap-3 mt-2 px-2.5">
				{showConvertBtn && (
					<button type="button" onClick={convert} className="px-4 py-2 bg-green-600 text-white rounded cursor-pointer">
						转换 PDF 并下载
					</button>
				)}

				{showConvertBtn && (
					<button type="button" onClick={convertStream} className="px-4 py-2 bg-green-800 text-white rounded cursor-pointer">
						转换 PDF Stream
					</button>
				)}

				{showConvertBtn && (
					<button type="button" onClick={clearFile} className="px-4 py-2 bg-green-900 text-white rounded cursor-pointer">
						清除文件
					</button>
				)}


				{readyToDownload && (
					<button type="button" onClick={downFile} className="px-4 py-2 bg-green-900 text-white rounded cursor-pointer">
						下载文件
					</button>
				)}
			</div>
		</form>
	);
}
