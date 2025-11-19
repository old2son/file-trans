'use client';

import { useState } from 'react';
import FileBtn from './FileBtn';
import LoadingBar from './LoadingBar';

export default function Excel2PdfClient() {
	const loading = true;
	const [progressValue, setProgress] = useState(0);

	return (
		<>
			<div style={{ color: '#f5f5fa' }}>
				<h1 className="m-auto text-center text-2xl text-black font-bold">Excel 转 PDF</h1>
				<p className="text-center text-stone-700">使用 node 获取 Excel 转 PDF</p>
				<FileBtn onProgress={setProgress} />

				<div className="flex flex-row">
					<svg
						className="w-6 h-6 text-green-800 dark:text-white"
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

					{/* {progress > 0 && progress < 100 && <LoadingBar value={progress} />} */}
					{loading && <LoadingBar className="basis-1/4" progress={progressValue} />}
				</div>
			</div>
		</>
	);
}
