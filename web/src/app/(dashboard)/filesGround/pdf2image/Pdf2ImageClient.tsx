'use client';

import { useState } from 'react';
import FileBtn from './FileBtn';

interface FileMsg {
	name: string;
	size: number;
	[key: string]: unknown;
}

export default function Pdf2ImageClient() {
	const [fileMsg, setFileMsg] = useState<FileMsg | null>({
		name: '',
		size: 0,
	});

	return (
		<div className="mt-20">
			<h1 className="m-auto text-center text-2xl text-black font-bold">PDF 转 图片</h1>
			<p className="text-center text-stone-700">使用 PDFJS 获取 PDF 转 图片</p>

			{fileMsg?.name && (
				<dl className="flex flex-row justify-between items-center gap-5 px-2.5 mt-1.5">
					<dt className="flex flex-row basis-3/4 shrink truncate">
						<svg
							className="min-w-6 h-6 text-red-800 dark:text-white"
							aria-hidden="true"
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							fill="none"
							viewBox="0 0 24 24"
						>
							<path
								className=""
								stroke="currentColor"
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2"
								d="M10 3v4a1 1 0 0 1-1 1H5m4 8h6m-6-4h6m4-8v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7.914a1 1 0 0 1 .293-.707l3.914-3.914A1 1 0 0 1 9.914 3H18a1 1 0 0 1 1 1Z"
							/>
						</svg>
						<span className="truncate text-black">{fileMsg.name}</span>
					</dt>
					<dd className="block basis-1/4 shrink-0"></dd>
				</dl>
			)}

			<FileBtn onFileMsg={setFileMsg} />
		</div>
	);
}
