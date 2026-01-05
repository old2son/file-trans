'use client';
import { useState } from 'react';

export default function Pdf2ExcelClient() {
	const [uploading, setUploading] = useState(false);

	async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;

		setUploading(true);
		const formData = new FormData();
		formData.append('file', file);

		const name = file.name.split('.')[0];

		try {
			// 注意这里是 POST 请求，发送的是 formData
			const response = await fetch('http://192.168.0.35:4000/api/PDF2Excel', {
				method: 'POST',
				body: formData
			});

			if (!response.ok) throw new Error('转换失败');

			// 1. 将响应转为 Blob (二进制大对象)
			const blob = await response.blob();

			// 2. 创建临时下载链接
			const url = window.URL.createObjectURL(blob);
		
				const a = document.createElement('a');
		
			a.href = url;
			a.download = `${name}.xlsx`; // 设置下载的文件名
		/* 	document.body.appendChild(a);
			a.click();

			// 3. 释放内存
			window.URL.revokeObjectURL(url); */
			alert('转换成功，文件已下载！');
		} catch (error) {
			console.error(error);
			alert('请求出错，请检查后端服务');
		} finally {
			setUploading(false);
		}
	}

	return (
		<div className="mt-20">
			<h1 className="m-auto text-center text-2xl text-black font-bold">PDF 转 Excel</h1>
			<p className="text-center text-stone-700">使用 Python 获取 PDF 转 PDF</p>

			{/* 测试请求按钮 */}
			<input type="file" accept=".pdf" onChange={handleUpload} disabled={uploading} />

			<p className="mt-2 text-sm text-gray-500">
				{uploading ? '正在转换中，请稍候...' : '选择 PDF 文件立即转换'}
			</p>
		</div>
	);
}
