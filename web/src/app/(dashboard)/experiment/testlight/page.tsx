'use client';
import React, { useState, useEffect } from 'react';
import { Sun, Moon, Palette, Zap, Shield, Layout } from 'lucide-react';

/**
 * 极简黑白主题切换组件
 * - 转白色：由内向外扩散 (Expansion)
 * - 转黑色：由外向内聚集 (Contraction)
 */
const App = () => {
	const [isDark, setIsDark] = useState(false); // ⭐ 固定初始值
	const [isRender, setIsRender] = useState(false);
	const [isAnimating, setIsAnimating] = useState(false);
	const [clipPath, setClipPath] = useState('');
	// 用于动画层显示的临时状态
	const [animatingTheme, setAnimatingTheme] = useState(isDark);

	const initColor = () => {
		const saved = localStorage.getItem('app-theme-dark');
		if (saved !== null) {
			setIsDark(saved === 'true');
		} else {
			setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
		}
		setIsRender(true);
	};

	// 只运行一次，初始化状态
	useEffect(() => {
		Promise.resolve().then(() => {
			initColor();
		});
	}, []);

	// 每次 isDark 变化时，更新 localStorage
	useEffect(() => {
		if (isRender === false) return;
		localStorage.setItem('app-theme-dark', String(isDark));
	}, [isDark, isRender]);

	const toggleTheme = (e: React.MouseEvent) => {
		if (isAnimating) return;

		const x = e.clientX;
		const y = e.clientY;
		const maxRadius = Math.hypot(window.innerWidth, window.innerHeight);
		const nextIsDark = !isDark;

		setIsAnimating(true);

		if (nextIsDark) {
			/**
			 * 场景 A: 转为黑色 (聚集)
			 * 逻辑：底层变为黑色，顶层（当前白色）从全屏缩小到点击点
			 */
			setAnimatingTheme(false); // 动画层保持白色
			setClipPath(`circle(${maxRadius}px at ${x}px ${y}px)`);

			// 切换主状态为黑色（底层可见）
			setIsDark(true);

			requestAnimationFrame(() => {
				setClipPath(`circle(0% at ${x}px ${y}px)`);
			});
		} else {
			/**
			 * 场景 B: 转为白色 (扩散)
			 * 逻辑：底层保持黑色，顶层（白色）从点击点扩张到全屏
			 */
			setAnimatingTheme(false); // 动画层变为白色
			setClipPath(`circle(0% at ${x}px ${y}px)`);

			// 此时不改变主状态 isDark，让底层保持黑色

			requestAnimationFrame(() => {
				setClipPath(`circle(${maxRadius}px at ${x}px ${y}px)`);
			});
		}

		// 动画结束后的状态同步
		setTimeout(() => {
			setIsDark(nextIsDark);
			setIsAnimating(false);
			setClipPath('');
		}, 700);
	};

	if (!isRender) return null;
	return (
		<div className="relative min-h-screen font-sans overflow-hidden bg-slate-950">
			{/* 1. 底层层级 (始终存在) */}
			<ThemeContent isDark={isDark} />

			{/* 2. 动画扩散/聚集层 */}
			{isAnimating && (
				<div
					className="fixed inset-0 z-50 pointer-events-none transition-all duration-700 ease-in-out"
					style={{ clipPath: clipPath }}
				>
					<ThemeContent isDark={animatingTheme} />
				</div>
			)}

			{/* 3. 交互 UI */}
			<nav className="fixed top-0 left-0 right-0 z-100 px-6 py-4">
				<div className="max-w-4xl mx-auto flex justify-between items-center">
					<div className="flex items-center gap-2 font-bold text-xl mix-blend-difference text-white">
						<Palette />
						<span>RadialMotion</span>
					</div>

					<button
						onClick={toggleTheme}
						className="group relative p-3 rounded-2xl bg-indigo-600 text-white shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 overflow-hidden"
					>
						<div className="relative z-10 flex items-center gap-2">
							{isDark ? (
								<>
									<Sun size={20} className="text-amber-300" />{' '}
									<span className="font-bold">切换浅色</span>
								</>
							) : (
								<>
									<Moon size={20} className="text-indigo-200" />{' '}
									<span className="font-bold">切换深色</span>
								</>
							)}
						</div>
					</button>
				</div>
			</nav>
		</div>
	);
};

const ThemeContent = ({ isDark }: { isDark: boolean }) => {
	return (
		<div
			className={`min-h-screen w-full transition-none ${isDark ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}
		>
			<main className="max-w-4xl mx-auto px-6 py-32">
				<div className="mb-16">
					<h1 className="text-6xl font-black mb-6 tracking-tighter">
						非对称 <span className="text-indigo-600">转场交互</span>
					</h1>
					<p className="text-slate-500 dark:text-slate-400 text-xl max-w-2xl leading-relaxed">
						转深色时，光明向中心<span className="text-indigo-500 font-bold">聚集</span>消失；
						<br />
						转浅色时，光明从中心<span className="text-indigo-500 font-bold">扩散</span>全屏。
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
					<div className="p-8 rounded-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
						<h3 className="text-xl font-bold mb-4 flex items-center gap-2">
							<Zap className="text-amber-500" /> 聚集 (Contraction)
						</h3>
						<p className="text-slate-500 dark:text-slate-400">
							当切换至黑色时，当前的浅色图层会向点击位置收缩，模拟光线被吸入的效果。
						</p>
					</div>
					<div className="p-8 rounded-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
						<h3 className="text-xl font-bold mb-4 flex items-center gap-2">
							<Sun className="text-indigo-500" /> 扩散 (Expansion)
						</h3>
						<p className="text-slate-500 dark:text-slate-400">
							当切换至白色时，新的浅色图层从点击位置向外扩张，如同黎明破晓。
						</p>
					</div>
				</div>

				<div className="mt-12 p-10 rounded-[2.5rem] bg-indigo-600 text-white shadow-2xl shadow-indigo-500/20">
					<h2 className="text-2xl font-bold mb-4">技术实现说明</h2>
					<p className="opacity-90 leading-relaxed">
						我们使用了两层 <code>ThemeContent</code>
						。在转深色时，我们让底层的全局状态立即变黑，同时让上层的白色预览层执行 <code>
							clip-path
						</code>{' '}
						缩小动画；转浅色时则相反。这种视觉错觉不仅流畅，而且极具动感。
					</p>
				</div>
			</main>
		</div>
	);
};

export default App;
