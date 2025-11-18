import type { Metadata } from 'next';
import FileBtn from './FileBtn';

export const metadata: Metadata = {
	title: 'Excel 转 PDF',
	description: 'nodejs Excel 转 PDF',
};

// 进度条组件
function LoadingBar() {
	return (
		<div className="mb-5 h-4 overflow-hidden rounded-full bg-gray-200">
			<div className="h-4 animate-pulse rounded-full bg-linear-to-r from-green-500 to-blue-500" style={{ width: '75%' }}></div>
		</div>
	);
}

export default function Page() {
	const loading = true;

	return (
		<>
			<FileBtn />
			{loading && <LoadingBar />}
		</>
	);
}
