'use client';

import Image from 'next/image';
import { openModal, closeModal } from '@/components/GlobalModal';
import { useRouter } from 'next/navigation';

const items = [
	{
		src: '/images/view_001.jpeg',
		text: 'excel 转 pdf',
		url: '/filesGround/excel2pdf',
	},
	{
		src: '/images/testCatbeat.jpg',
		text: '功能蛆',
	},
	{
		src: '/images/testCatMoon.jpg',
		text: '功能蛆',
	},
];

export default function Page() {
	const router = useRouter();

	const toFnPage = (url?: string) => {
		if (!url) {
			handleTestModal({
				title: '提示',
				content: '该功能正在开发中，敬请期待！',
			});
			return;
		}
		router.push(url);
	};

	const handleTestModal = (
		props: Readonly<{
			title?: string;
			content?: React.ReactNode | string;
		}>
	) => {
		openModal({
			content: (
				<div className="p-4">
					<h2 className="text-xl font-bold mb-4">{props.title || '标题'}</h2>
					<p className="mb-4">{props.content || '正文'}</p>
					<button onClick={closeModal} className="px-4 py-2 w-full bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer">
						关闭
					</button>
				</div>
			),
		});
	};

	return (
		<div className="">
			<nav>
				<ul>
					<li>
						<a href="#">菜单项 1</a>
					</li>
					<li>
						<a href="#">菜单项 2</a>
					</li>
					<li>
						<a href="#">菜单项 3</a>
					</li>
				</ul>
			</nav>

			{/* <div className="p-4">
                <button
                    onClick={handleTestModal}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 cursor-pointer"
                >
                    打开模态框测试
                </button>
            </div> */}

			<ul className="grid grid-cols-1 sm:grid-cols-3">
				{items.map((item, index) => (
					<li
						key={index}
						className="cursor-pointer"
						onClick={() => {
							toFnPage(item?.url);
						}}
					>
						<div className="relative w-16 h-16">
							<Image
								loading="eager"
								src={item.src}
								alt={item.text || ''}
								fill
								sizes="(max-width: 768px) 50vw, 100vw"
								className="object-cover"
							/>
						</div>
						{item.text && (
							<p className="text-xs">
								{item.text}
								{index || ''}
							</p>
						)}
					</li>
				))}
			</ul>

			{/* <div className="p-4 bg-gray-100 text-blue-500 sm:text-lg">Hello</div> */}

			{/* <div className="text-base sm:text-lg md:text-xl lg:text-2xl">响应式字体</div> */}
		</div>
	);
}
