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
			// 同源代理：由 Next 服务端转发到 Python 转换服务，避免跨域和地址配错
			const response = await fetch('/file-api/pdf2excel', {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				const detail = (await response.json().catch(() => null)) as { detail?: string } | null;
				throw new Error(detail?.detail ?? `转换失败（HTTP ${response.status}）`);
			}

			// 后端在“没检测到表格”时会返回 200 + JSON，不能当 xlsx 下载
			const contentType = response.headers.get('content-type') ?? '';
			if (contentType.includes('application/json')) {
				const data = (await response.json().catch(() => null)) as { message?: string; status?: string } | null;
				throw new Error(data?.message ?? 'PDF 中没有检测到表格');
			}

			// 1. 将响应转为 Blob (二进制大对象)
			const blob = await response.blob();

			// 2. 创建临时下载链接并真正触发下载
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');

			a.href = url;
			a.download = `${name}.xlsx`;
			document.body.appendChild(a);
			a.click();
			a.remove();

			// 3. 释放内存
			window.URL.revokeObjectURL(url);
			alert('转换成功，文件已下载！');
		} catch (error) {
			console.error(error);
			alert(error instanceof Error ? error.message : '请求出错，请检查后端服务');
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
