'use client';

import { useState } from 'react';

export default function Page() {
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

		const total = Number(res.headers.get("Content-Length"));
		console.log(total, '总字节数');
		let loaded = 0;

		const reader = res.body!.getReader();

		const stream = new ReadableStream({
			start(controller) {
				function pump() {
					reader.read().then(({ done, value }) => {
						if (done) {
							controller.close();
							return;
						}

						console.log('读取到数据块：', value);
						console.log('字节已接收', value.length);

						loaded += value.length;
						console.log((loaded / total) * 100 + '%');
						controller.enqueue(value);
						pump();
					});
				}
				pump();
			},
		});

		const blob = await new Response(stream).blob();

		/* const reader = res.body!.getReader();
		let received = 0;
		const chunks = [];

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			received += value.length;
			console.log(received, '字节已接收');
			chunks.push(value);
		}

		console.log('最终 PDF 大小:', received, '字节');

		const blob = new Blob(chunks, { type: 'application/pdf' }); */

		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');

		console.log('文件', blob);

		a.href = url;
		a.download = file.name.replace(/\.(xls|xlsx)$/, '.pdf');
		a.click();

		URL.revokeObjectURL(url);
	}

	return (
		<form onSubmit={(e) => e.preventDefault()}>
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
		</form>
	);
}
