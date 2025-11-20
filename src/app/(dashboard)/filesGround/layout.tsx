import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import '@/styles/home.css';
import RouteWatcher from '@/components/RouteWatcher';
import GlobalModal from '@/components/GlobalModal';
import NavBar from '@/components/NavBar';

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
				<NavBar
					menu={
						<>
							<a href="/filesGround" className="text-gray-700 hover:text-black">
								首页
							</a>
							<a href="/experiment" className="text-gray-700 hover:text-black">
								测试
							</a>
						</>
					}
					mobileMenu={
						<>
							<a href="/filesGround" className="block px-2 py-1 text-gray-700 hover:bg-gray-100 rounded">
								首页
							</a>
							<a href="/experiment" className="block px-2 py-1 text-gray-700 hover:bg-gray-100 rounded">
								测试
							</a>
						</>
					}
				/>
				{/* 处理全局挂载的组件，如 GlobalModal*/}
				<RouteWatcher />
				{children}
				<GlobalModal />
			</body>
		</html>
	);
}
