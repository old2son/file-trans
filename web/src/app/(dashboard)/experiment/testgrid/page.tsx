'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
	Activity,
	ShieldCheck,
	Cpu,
	Database,
	Globe,
	AlertTriangle,
	ArrowUpRight,
	ArrowDownRight,
	Menu,
	Bell,
	User,
    LucideIcon
} from 'lucide-react';

// --- 子组件：实时数据卡片 ---
const MetricCard = ({ title, value, unit, trend, icon: Icon, color }: {
    title: string;
    value: number;
    unit: string;
    trend: number;
    icon: LucideIcon;
    color: string;
}) => (
	<div className="relative overflow-hidden bg-slate-900/50 border border-slate-700/50 p-4 rounded-xl backdrop-blur-md group hover:border-blue-500/50 transition-all duration-500">
		<div
			className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity text-${color}-400`}
		>
			<Icon size={48} />
		</div>
		<div className="flex items-center gap-3 mb-2">
			<div className={`p-2 rounded-lg bg-${color}-500/10 text-${color}-400`}>
				<Icon size={18} />
			</div>
			<span className="text-slate-400 text-xs font-bold uppercase tracking-wider">{title}</span>
		</div>
		<div className="flex items-baseline gap-2">
			<span className="text-2xl font-black text-white font-mono">{value}</span>
			<span className="text-slate-500 text-[10px]">{unit}</span>
		</div>
		<div className={`mt-2 flex items-center text-[10px] ${trend >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
			{trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
			<span className="ml-1 font-bold">{Math.abs(trend)}% 从上小时</span>
		</div>
		<div className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent w-full opacity-0 group-hover:opacity-100 transition-opacity" />
	</div>
);

// --- 子组件：模拟地图视图 ---
const MapView = () => (
	<div className="relative w-full h-full min-h-[300px] bg-slate-900/80 rounded-2xl border border-slate-700/50 overflow-hidden flex items-center justify-center">
		{/* 模拟背景网格 */}
		<div
			className="absolute inset-0 opacity-20"
			style={{ backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '30px 30px' }}
		/>

		<div className="relative z-10 text-center">
			<Globe className="w-32 h-32 text-blue-500/20 animate-pulse mb-4 mx-auto" />
			<div className="flex flex-col gap-1">
				<div className="text-blue-400 text-[10px] font-mono animate-bounce">AETHER GRID ACTIVATED</div>
				<div className="text-slate-500 text-[8px] uppercase tracking-[0.3em]">
					Global Node Connection: Stable
				</div>
			</div>
		</div>

		{/* 模拟数据点 */}
		<div className="absolute top-1/4 left-1/3 w-2 h-2 bg-blue-400 rounded-full animate-ping" />
		<div
			className="absolute top-1/2 right-1/4 w-2 h-2 bg-purple-400 rounded-full animate-ping"
			style={{ animationDelay: '1s' }}
		/>
		<div
			className="absolute bottom-1/3 left-1/2 w-2 h-2 bg-emerald-400 rounded-full animate-ping"
			style={{ animationDelay: '2s' }}
		/>

		{/* 边角科技感装饰 */}
		<div className="absolute top-4 left-4 border-t border-l border-blue-500 w-4 h-4" />
		<div className="absolute top-4 right-4 border-t border-r border-blue-500 w-4 h-4" />
		<div className="absolute bottom-4 left-4 border-b border-l border-blue-500 w-4 h-4" />
		<div className="absolute bottom-4 right-4 border-b border-r border-blue-500 w-4 h-4" />
	</div>
);

// --- 主组件 ---
export default function App() {
	const [time, setTime] = useState(new Date());
	const [data, setData] = useState({ cpu: 42, ram: 65, net: 124, alerts: 2 });

	useEffect(() => {
		const timer = setInterval(() => {
			setTime(new Date());
			setData((prev) => ({
				cpu: Math.floor(30 + Math.random() * 40),
				ram: Math.floor(60 + Math.random() * 10),
				net: Math.floor(100 + Math.random() * 50),
				alerts: Math.random() > 0.9 ? prev.alerts + 1 : prev.alerts
			}));
		}, 2000);
		return () => clearInterval(timer);
	}, []);

	return (
		<div className="min-h-screen bg-[#020617] text-slate-200 p-4 md:p-6 font-sans selection:bg-blue-500/30">
			{/* 顶部导航栏 */}
			<header className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
				<div className="flex items-center gap-4">
					<div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-600/20">
						<Activity className="text-white" size={24} />
					</div>
					<div>
						<h1 className="text-xl font-black tracking-tighter text-white uppercase italic">
							Aether<span className="text-blue-500">Grid</span>{' '}
							<span className="text-xs font-normal not-italic text-slate-500 ml-2">V2.4.0</span>
						</h1>
						<p className="text-[10px] text-slate-500 font-mono">
							SYSTEM STATUS: OPTIMAL // SECURITY: ACTIVE
						</p>
					</div>
				</div>

				<div className="flex items-center gap-6 bg-slate-900/50 border border-slate-800 px-6 py-2 rounded-full backdrop-blur-xl">
					<div className="text-right">
						<div className="text-xs font-mono text-blue-400 leading-none">{time.toLocaleTimeString()}</div>
						<div className="text-[8px] text-slate-500 uppercase tracking-widest">
							{time.toLocaleDateString()}
						</div>
					</div>
					<div className="h-4 w-[1px] bg-slate-700" />
					<div className="flex gap-3">
						<Bell size={16} className="text-slate-400 hover:text-white cursor-pointer transition-colors" />
						<User size={16} className="text-slate-400 hover:text-white cursor-pointer transition-colors" />
						<Menu size={16} className="text-slate-400 hover:text-white cursor-pointer transition-colors" />
					</div>
				</div>
			</header>

			{/* 主布局网格 */}
			<main className="grid grid-cols-12 gap-6">
				{/* 左侧：监控卡片 */}
				<div className="col-span-12 lg:col-span-3 flex flex-col gap-6">
					<MetricCard title="CPU 负载" value={data.cpu} unit="%" trend={+5.2} icon={Cpu} color="blue" />
					<MetricCard
						title="内存占用"
						value={data.ram}
						unit="%"
						trend={-1.8}
						icon={Database}
						color="purple"
					/>
					<MetricCard
						title="网络速率"
						value={data.net}
						unit="Mbps"
						trend={+12.4}
						icon={Globe}
						color="emerald"
					/>
					<MetricCard
						title="异常警报"
						value={data.alerts}
						unit="件"
						trend={0}
						icon={ShieldCheck}
						color="rose"
					/>
				</div>

				{/* 中间：主视图 (地图) */}
				<div className="col-span-12 lg:col-span-6 flex flex-col gap-6">
					<div className="flex-grow">
						<MapView />
					</div>
					<div className="bg-slate-900/50 border border-slate-700/50 p-4 rounded-xl">
						<div className="flex justify-between items-center mb-4">
							<h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
								<div className="w-1 h-3 bg-blue-500" /> 实时流量监控
							</h3>
							<div className="flex gap-2">
								<div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
								<div className="w-2 h-2 rounded-full bg-slate-700" />
							</div>
						</div>
						{/* 模拟简单折线图 */}
						<div className="h-24 w-full flex items-end gap-1">
							{[40, 60, 45, 70, 80, 55, 90, 100, 85, 70, 60, 75, 95].map((h, i) => (
								<div
									key={i}
									className="flex-grow bg-blue-500/20 hover:bg-blue-500/40 transition-colors rounded-t-sm relative group"
									style={{ height: `${h}%` }}
								>
									<div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-blue-500 text-[8px] text-white px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
										{h}k
									</div>
								</div>
							))}
						</div>
					</div>
				</div>

				{/* 右侧：列表与日志 */}
				<div className="col-span-12 lg:col-span-3 flex flex-col gap-6">
					{/* 活动进程 */}
					<div className="bg-slate-900/50 border border-slate-700/50 rounded-xl flex flex-col h-full overflow-hidden">
						<div className="p-4 border-b border-slate-800 flex justify-between items-center">
							<h3 className="text-xs font-bold text-slate-300">活跃进程</h3>
							<span className="text-[10px] text-blue-400 font-mono">LIVE</span>
						</div>
						<div className="p-4 flex flex-col gap-4">
							{[
								{ name: 'Kernel_Task', user: 'root', load: 24 },
								{ name: 'Node_Server_A', user: 'admin', load: 12 },
								{ name: 'Neural_Engine', user: 'system', load: 45 },
								{ name: 'Database_Sync', user: 'root', load: 0.8 }
							].map((process, i) => (
								<div key={i} className="flex justify-between items-center">
									<div>
										<div className="text-xs font-bold text-slate-200">{process.name}</div>
										<div className="text-[9px] text-slate-500 uppercase">{process.user}</div>
									</div>
									<div className="text-right text-[10px] font-mono">
										<div className="text-blue-400">{process.load}%</div>
										<div className="w-12 h-1 bg-slate-800 rounded-full mt-1">
											<div
												className="h-full bg-blue-500 rounded-full"
												style={{ width: `${process.load}%` }}
											/>
										</div>
									</div>
								</div>
							))}
						</div>

						{/* 底部日志 */}
						<div className="mt-auto p-4 bg-black/40 font-mono text-[9px] text-emerald-500/80 space-y-1">
							<div className="flex gap-2">
								<span className="text-slate-600">[14:02:11]</span> AUTHENTICATION_SUCCESS
							</div>
							<div className="flex gap-2">
								<span className="text-slate-600">[14:02:15]</span> NODE_JP_01 CONNECTED
							</div>
							<div className="flex gap-2 animate-pulse">
								<span className="text-slate-600">[14:02:22]</span> SYNCING DATA...
							</div>
						</div>
					</div>

					{/* 状态统计 */}
					<div className="bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-blue-500/30 p-4 rounded-xl relative overflow-hidden group">
						<div className="absolute -right-4 -bottom-4 text-blue-500/10 group-hover:scale-110 transition-transform">
							<ShieldCheck size={100} />
						</div>
						<h4 className="text-xs font-bold text-white mb-1">系统安全性评估</h4>
						<div className="text-2xl font-black text-blue-400">99.8%</div>
						<p className="text-[10px] text-slate-400 mt-2 max-w-[150px]">
							当前防御系统运行正常，未检测到恶意穿透尝试。
						</p>
					</div>
				</div>
			</main>

			{/* 底部装饰条 */}
			<footer className="mt-8 flex justify-between items-center border-t border-slate-800 pt-4 text-[10px] text-slate-600 uppercase tracking-widest font-mono">
				<div>© 2024 AETHER CORE CORP. ALL RIGHTS RESERVED.</div>
				<div className="flex gap-4">
					<span className="flex items-center gap-1">
						<div className="w-1 h-1 bg-emerald-500 rounded-full" /> CLOUD: SYNCED
					</span>
					<span className="flex items-center gap-1">
						<div className="w-1 h-1 bg-blue-500 rounded-full" /> ENCRYPTION: AES-256
					</span>
				</div>
			</footer>
		</div>
	);
}
