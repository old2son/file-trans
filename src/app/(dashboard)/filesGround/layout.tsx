import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import '@/styles/home.css';
import RouteWatcher from '@/components/RouteWatcher';
import GlobalModal from '@/components/GlobalModal';

const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin'],
});

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin'],
});

export const metadata: Metadata = {
	title: '文件处理区',
	description: '文件上传、下载及管理',
};

export default function FileGroundRootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
				{/* 处理全局挂载的组件，如 GlobalModal*/}
				<RouteWatcher />
				{children}
				<GlobalModal />
			</body>
		</html>
	);
}
