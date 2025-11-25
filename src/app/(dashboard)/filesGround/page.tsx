'use client';

import Image from 'next/image';
import { openModal, closeModal } from '@/components/GlobalModal';
import { useRouter } from 'next/navigation';

const items = [
	{
		src: '/images/view_001.jpeg',
		text: 'EXCEL 转 PDF',
		url: '/filesGround/excel2pdf',
	},
	{
		src: '/images/testCatMoon.jpg',
		text: 'PDF 转 EXCEL',
		url: '/filesGround/pdf2excel',
	},
	{
		src: '/images/testCatbeat.jpg',
		text: 'PDF 转 图片',
		url: '/filesGround/pdf2image',
	},
	{
		src: '/images/batcat.png',
		text: '待定',
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
		<div className="pb-15 mt-15">
			<ul className="grid grid-cols-1 gap-5 px-5 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3">
				{items.map((item, index) => (
					<li
						key={index}
						className="border border-solid border-[#d6d6df] rounded cursor-pointer transition-shadow bg-white hover:shadow-lg md:flex md:justify-start md:items-center md:gap-3 md:p-1.5 md:font-bold" 
						onClick={() => {
							toFnPage(item?.url);
						}}
					>
						<div className="relative h-dvw sm:h-[50vw] md:w-[8vw] md:h-[8vw]">
							<Image
								loading="eager"
								src={item.src}
								alt={item.text || ''}
								fill
								sizes="(max-width: 768px) 50vw, 100vw"
								className="object-cover md:rounded"
							/>
						</div>
						{item.text && <p className="py-2.5 text-xl sm:text-sm text-center text-[#33333b]">{item.text}</p>}
					</li>
				))}
			</ul>
		</div>
	);
}
