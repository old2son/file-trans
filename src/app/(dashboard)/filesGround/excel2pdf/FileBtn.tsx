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
        
        console.log('文件', blob)
       
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

			<button type="button" onClick={convert} className="ml-3 px-4 py-2 bg-green-600 text-white rounded">
				转换 PDF
			</button>
		</form>
	);
}
