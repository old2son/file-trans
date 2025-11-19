'use client';

import { useState } from 'react';

export default function FileBtn({ onProgress }: { onProgress: (p: number) => void }) {
	const [file, setFile] = useState<File | null>(null);

	function getFile(e: React.ChangeEvent<HTMLInputElement>) {
		if (e.target.files?.[0]) {
			setFile(e.target.files[0]);
			console.log('选中的文件：', e.target.files[0]);
		}
	}

	async function convert() {
		if (!file) return alert('请先选择文件');

		const form = new FormData();
		form.append('file', file);

		const res = await fetch('/api/excel2pdf', {
			method: 'POST',
			body: form,
		});

		const blob = await res.blob();
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');

		console.log('文件', blob);

		a.href = url;
		a.download = file.name.replace(/\.(xls|xlsx)$/, '.pdf');
		a.click();

		URL.revokeObjectURL(url);
	}

	async function convertStream() {
		if (!file) return alert('请先选择文件');

		const form = new FormData();
		form.append('file', file);

		const res = await fetch('/api/excel2pdfStream', {
			method: 'POST',
			body: form,
		});

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
						console.log((loaded / total) * 100 + '%');
						controller.enqueue(value);
						pump();
					});
				}
				pump();
			},
		});

		const blob = await new Response(stream).blob();
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');

		a.href = url;
		a.download = file.name.replace(/\.(xls|xlsx)$/, '.pdf');
		a.click();

		URL.revokeObjectURL(url);
	}

	return (
		<form onSubmit={(e) => e.preventDefault()}>
			<div className="grid grid-cols-3">
				<div className="relative inline-block">
					<label htmlFor="excel2pdf" className="px-4 py-2 bg-blue-500 text-white rounded cursor-pointer">
						选择文件
					</label>

					<input
						type="file"
						id="excel2pdf"
						name="excel2pdf"
						className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
						onChange={getFile}
					/>
				</div>

				<button type="button" onClick={convert} className="ml-3 px-4 py-2 bg-green-600 text-white rounded cursor-pointer">
					转换 PDF
				</button>

				<button type="button" onClick={convertStream} className="ml-3 px-4 py-2 bg-green-900 text-white rounded cursor-pointer">
					转换 PDF Stream
				</button>
			</div>
		</form>
	);
}
