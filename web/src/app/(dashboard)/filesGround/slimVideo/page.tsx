import type { Metadata } from 'next';
import FFmpegClient from './FFmpegClient';

export const metadata: Metadata = {
	title: '视频压缩',
	description: 'FFmpeg 视频压缩/转换',
	keywords: ['FFmpeg', '视频压缩', '视频转换', '文件处理区'],
};

export default function Page() {
	return <FFmpegClient />;
}
