'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Maximize2, ZoomIn, Heart, Share2 } from 'lucide-react';

/**
 * 核心逻辑说明：
 * 1. 使用 getBoundingClientRect() 获取点击元素在页面上的起始坐标和尺寸。
 * 2. 在全屏遮罩层中创建一个占位元素，其初始位置与起始位置重合。
 * 3. 通过 CSS Transition 将其 transform 属性过渡到屏幕中心并缩放至全屏。
 */

const ITEMS = [
	{
		id: 1,
		url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
		title: '阿尔卑斯山脉',
		tag: '自然'
	},
	{
		id: 2,
		url: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=80',
		title: '静谧湖泊',
		tag: '旅行'
	},
	{
		id: 3,
		url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80',
		title: '原始森林',
		tag: '探险'
	},
	{
		id: 4,
		url: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=800&q=80',
		title: '海岸落日',
		tag: '景观'
	},
	{
		id: 5,
		url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80',
		title: '广袤原野',
		tag: '摄影'
	},
	{
		id: 6,
		url: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=800&q=80',
		title: '山间溪流',
		tag: '生态'
	}
];

export default function App() {
	const [selectedItem, setSelectedItem] = useState(null);
	const [initialRect, setInitialRect] = useState(null);
	const [isExpanding, setIsExpanding] = useState(false);

	const handleItemClick = (e, item) => {
		const rect = e.currentTarget.getBoundingClientRect();
		setInitialRect(rect);
		setSelectedItem(item);

		// 短暂延迟以触发进入动画
		setTimeout(() => {
			setIsExpanding(true);
		}, 10);
	};

	const handleClose = () => {
		setIsExpanding(false);
		// 等待动画结束再卸载组件
		setTimeout(() => {
			setSelectedItem(null);
			setInitialRect(null);
		}, 500);
	};

	return (
		<div className="min-h-screen bg-neutral-950 text-white font-sans p-6 md:p-12">
			{/* 头部标题 */}
			<header className="max-w-6xl mx-auto mb-12">
				<h1 className="text-4xl font-light tracking-tight mb-2">
					原生感<span className="font-bold text-indigo-500">展开交互</span>
				</h1>
				<p className="text-neutral-500">点击下方卡片，体验平滑的全屏缩放过渡效果</p>
			</header>

			{/* 网格布局 */}
			<main className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
				{ITEMS.map((item) => (
					<div
						key={item.id}
						onClick={(e) => handleItemClick(e, item)}
						className="group relative aspect-[4/3] rounded-2xl overflow-hidden cursor-zoom-in bg-neutral-900 border border-white/5 transition-transform duration-300 hover:scale-[1.02] active:scale-95"
					>
						<img
							src={item.url}
							alt={item.title}
							className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
						/>
						<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
							<span className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-1">
								{item.tag}
							</span>
							<h3 className="text-lg font-semibold">{item.title}</h3>
						</div>
						{/* 隐藏的占位标识 */}
						<div
							className={`absolute inset-0 bg-black/40 transition-opacity ${selectedItem?.id === item.id ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
						/>
					</div>
				))}
			</main>

			{/* 全屏展开层 */}
			{selectedItem && initialRect && (
				<div
					className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-500 ${isExpanding ? 'bg-black/95 backdrop-blur-sm' : 'bg-transparent pointer-events-none'}`}
				>
					{/* 模拟起始位置并扩展的容器 */}
					<div
						style={{
							position: 'absolute',
							top: isExpanding ? '0' : `${initialRect.top}px`,
							left: isExpanding ? '0' : `${initialRect.left}px`,
							width: isExpanding ? '100%' : `${initialRect.width}px`,
							height: isExpanding ? '100%' : `${initialRect.height}px`,
							transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
							borderRadius: isExpanding ? '0px' : '16px',
							overflow: 'hidden'
						}}
						className="shadow-2xl z-10"
					>
						<img src={selectedItem.url} className="w-full h-full object-cover" alt="Expanded view" />

						{/* 展开后的额外内容详情 */}
						<div
							className={`absolute inset-x-0 bottom-0 p-8 md:p-16 bg-gradient-to-t from-black via-black/20 to-transparent transition-opacity duration-700 delay-300 ${isExpanding ? 'opacity-100' : 'opacity-0'}`}
						>
							<div className="max-w-4xl mx-auto">
								<span className="inline-block px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold mb-4 border border-indigo-500/30">
									{selectedItem.tag}
								</span>
								<h2 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
									{selectedItem.title}
								</h2>
								<p className="text-neutral-400 text-lg max-w-2xl mb-8 leading-relaxed">
									这是一段详细的场景描述。通过这种平滑的过渡，用户不仅能看到细节，还能感受到空间上的逻辑关联，极大地提升了产品的“呼吸感”和高级感。
								</p>
								<div className="flex gap-4">
									<button className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full font-bold hover:bg-indigo-50 transition-colors">
										<Heart size={18} fill="currentColor" /> 收藏此景
									</button>
									<button className="flex items-center gap-2 px-6 py-3 bg-white/10 text-white rounded-full font-bold hover:bg-white/20 transition-colors">
										<Share2 size={18} /> 分享
									</button>
								</div>
							</div>
						</div>

						{/* 关闭按钮 */}
						<button
							onClick={handleClose}
							className={`absolute top-8 right-8 p-4 rounded-full bg-black/20 hover:bg-white/20 text-white backdrop-blur-md border border-white/10 transition-all duration-500 ${isExpanding ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 rotate-90'}`}
						>
							<X size={24} />
						</button>
					</div>
				</div>
			)}

			{/* 页脚装饰 */}
			<footer className="max-w-6xl mx-auto mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-neutral-600 text-sm">
				<div className="flex items-center gap-4">
					<div className="flex -space-x-2">
						{[1, 2, 3].map((i) => (
							<div key={i} className="w-8 h-8 rounded-full border-2 border-neutral-950 bg-neutral-800" />
						))}
					</div>
					<span>3.2k 人已探索此画廊</span>
				</div>
				<p>© 2024 UI TRANSITION PROTOTYPE</p>
			</footer>
		</div>
	);
}
