'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Maximize2, LayoutGrid, Sun, ArrowLeft, FlaskConical, Tag } from 'lucide-react';

type ExperimentItem = {
	path: string;
	title: string;
	description: string;
	category: string;
	tags: string[];
	icon: React.ReactNode;
	bg: string;
	accent: string;
};

const items: ExperimentItem[] = [
	{
		path: '/experiment/testFullScreen',
		title: '全屏展开交互',
		description: '卡片点击平滑缩放至全屏，基于 getBoundingClientRect 起始位置与 CSS Transition 的原生过渡动画。',
		category: '动效 / 转场',
		tags: ['全屏', '画廊', 'Transition'],
		icon: <Maximize2 size={22} />,
		bg: 'from-indigo-500/10 via-purple-500/5 to-transparent',
		accent: 'text-indigo-500'
	},
	{
		path: '/experiment/testgrid',
		title: '科技感监控面板',
		description: '12 列响应式数据仪表盘，实时 CPU / 内存 / 网络 / 告警模拟，含地图网格、流量柱状图与终端日志。',
		category: '布局 / 数据可视化',
		tags: ['Grid', 'Dashboard', '实时数据'],
		icon: <LayoutGrid size={22} />,
		bg: 'from-blue-500/10 via-cyan-500/5 to-transparent',
		accent: 'text-blue-500'
	},
	{
		path: '/experiment/testlight',
		title: '径向主题切换',
		description: '基于点击位置的 clip-path 圆形扩散 / 聚集动画，深色与浅色之间的非对称视觉转场。',
		category: '动效 / 主题',
		tags: ['Theme', 'clip-path', 'DarkMode'],
		icon: <Sun size={22} />,
		bg: 'from-amber-500/10 via-rose-500/5 to-transparent',
		accent: 'text-amber-500'
	}
];

export default function ExperimentIndex() {
	const router = useRouter();

	return (
		<div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 text-slate-100 font-sans">
			<div className="pointer-events-none absolute inset-0 overflow-hidden">
				<div
					className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-indigo-600/10 blur-3xl"
					style={{ backgroundImage: 'radial-gradient(circle, rgba(99,102,241,0.18), transparent 70%)' }}
				/>
				<div
					className="absolute bottom-0 -left-32 h-[420px] w-[420px] rounded-full blur-3xl"
					style={{ backgroundImage: 'radial-gradient(circle, rgba(6,182,212,0.12), transparent 70%)' }}
				/>
			</div>

			<div className="relative mx-auto max-w-6xl px-5 py-12 md:px-8 md:py-16">
				<header className="mb-10 flex flex-col gap-6 md:mb-14">
					<div className="flex flex-wrap items-center gap-3">
						<button
							type="button"
							onClick={() => router.back()}
							className="group flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 backdrop-blur transition hover:border-white/20 hover:bg-white/10 hover:text-white"
						>
							<ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
							<span>返回</span>
						</button>
						<span className="flex items-center gap-1.5 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-indigo-300">
							<FlaskConical size={14} />
							Experiment Lab
						</span>
					</div>

					<div className="flex flex-col gap-3">
						<h1 className="text-3xl font-black leading-tight tracking-tight md:text-5xl">
							<span className="bg-gradient-to-br from-white via-indigo-100 to-indigo-400 bg-clip-text text-transparent">
								测试导航台
							</span>
						</h1>
						<p className="max-w-2xl text-sm leading-relaxed text-slate-400 md:text-base">
							这里收纳前端交互、布局、动效的各种实验项目。点击任意卡片进入对应测试页面，
							验证组件的实际表现、边界情况与跨端适配。
						</p>
					</div>

					<div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
						<div className="flex items-center gap-1.5">
							<span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
							<span>共 {items.length} 个可访问实验</span>
						</div>
						<div className="hidden h-1 w-1 rounded-full bg-slate-700 md:inline-block" />
						<div className="hidden md:block">支持：移动端 / 平板 / 桌面</div>
					</div>
				</header>

				<section className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
					{items.map((item, index) => (
						<Link
							key={item.path}
							href={item.path}
							className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.06] hover:shadow-[0_10px_40px_-12px_rgba(99,102,241,0.35)]"
						>
							<div
								className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${item.bg} opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
							/>

							<div className="relative mb-6 flex items-start justify-between">
								<div
									className={`flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 ${item.accent} transition-colors group-hover:bg-white/10`}
								>
									{item.icon}
								</div>
								<div className="font-mono text-[11px] text-slate-500">
									#{String(index + 1).padStart(2, '0')}
								</div>
							</div>

							<div className="relative flex flex-1 flex-col gap-3">
								<div>
									<h2 className="text-lg font-bold text-white transition-colors group-hover:text-indigo-100">
										{item.title}
									</h2>
									<div className="mt-1.5 flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-slate-500">
										<Tag size={10} />
										{item.category}
									</div>
								</div>

								<p className="text-sm leading-relaxed text-slate-400">{item.description}</p>

								<div className="mt-auto flex flex-wrap gap-1.5 pt-3">
									{item.tags.map((tag) => (
										<span
											key={tag}
											className="rounded-full border border-white/5 bg-white/[0.04] px-2 py-0.5 text-[10px] text-slate-400 transition-colors group-hover:border-white/10 group-hover:text-slate-200"
										>
											{tag}
										</span>
									))}
								</div>
							</div>

							<div className="relative mt-5 flex items-center justify-between border-t border-white/5 pt-4 text-xs text-slate-400">
								<span>进入实验页</span>
								<span className="flex items-center gap-1 font-semibold text-indigo-300 transition-all group-hover:gap-2 group-hover:text-indigo-200">
									GO
									<ArrowLeft size={12} className="rotate-180" />
								</span>
							</div>
						</Link>
					))}

					<div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-slate-500">
						<div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/5 bg-white/[0.02] text-slate-500">
							<FlaskConical size={22} />
						</div>
						<div className="mt-6">
							<h3 className="text-base font-semibold text-slate-300">更多实验开发中…</h3>
							<p className="mt-2 text-sm leading-relaxed">
								后续将在 experiment 目录下新增更多测试页面，新增的路由会自动进入本导航列表。
							</p>
						</div>
						<div className="mt-5 inline-flex w-fit items-center gap-1 rounded-full border border-white/5 bg-white/[0.02] px-2.5 py-1 text-[10px]">
							<span className="inline-block h-1 w-1 rounded-full bg-amber-400 animate-pulse" />
							WIP
						</div>
					</div>
				</section>

				<footer className="mt-14 flex flex-col items-start justify-between gap-3 border-t border-white/5 pt-6 text-[11px] text-slate-500 md:flex-row md:items-center">
					<div className="font-mono">/app/(dashboard)/experiment/page.tsx · Experiment NavIndex</div>
					<div className="flex items-center gap-4">
						<span>路径: /experiment</span>
						<span className="h-1 w-1 rounded-full bg-slate-700" />
						<span>路由方式: Next.js App Router</span>
					</div>
				</footer>
			</div>
		</div>
	);
}
