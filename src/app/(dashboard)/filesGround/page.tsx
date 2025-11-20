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
		<div className="mt-15">
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
		</div>
	);
}
