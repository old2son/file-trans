'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type Stage = 'idle' | 'uploading' | 'converting' | 'done';
type QualityKey = 'high' | 'balanced' | 'small';

type Result = { id: string; name: string; size: number; originalSize: number };

/** 服务端产物保留 1 小时，与 route.ts 里的 JOB_TTL_MS 保持一致 */
const RETENTION_MS = 60 * 60 * 1000;

type RecentItem = { id: string; name: string; size: number; originalSize?: number; createdAt: number };

type StreamMessage =
	| { type: 'meta'; duration: number; width: number; height: number; size: number }
	| { type: 'progress'; percent: number; speed: string; outTime: number }
	| { type: 'done'; id: string; name: string; size: number; originalSize: number }
	| { type: 'error'; message: string };

const QUALITIES: { value: QualityKey; label: string; note: string }[] = [
	{ value: 'high', label: '高画质', note: 'CRF 20' },
	{ value: 'balanced', label: '标准', note: 'CRF 26' },
	{ value: 'small', label: '小体积', note: 'CRF 30' }
];

const HEIGHTS: { value: number; label: string }[] = [
	{ value: 0, label: '原画' },
	{ value: 1080, label: '1080p' },
	{ value: 720, label: '720p' },
	{ value: 480, label: '480p' }
];

const VIDEO_EXT = ['.mp4', '.mov', '.mkv', '.avi', '.webm', '.m4v', '.wmv', '.flv', '.ts', '.mts'];
const MAX_SIZE = 8 * 1024 * 1024 * 1024;

function formatElapsed(milliseconds: number) {
	const total = Math.floor(milliseconds / 1000);
	const hours = Math.floor(total / 3600);
	const minutes = Math.floor((total % 3600) / 60);
	const seconds = total % 60;
	const pad = (value: number) => String(value).padStart(2, '0');
	return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
}

function formatBytes(bytes: number) {
	if (!bytes) return '0 B';
	const units = ['B', 'KB', 'MB', 'GB'];
	const power = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
	return `${(bytes / 1024 ** power).toFixed(power === 0 ? 0 : 1)} ${units[power]}`;
}

async function readNdjson(body: ReadableStream<Uint8Array>, onMessage: (message: StreamMessage) => void) {
	const reader = body.getReader();
	const decoder = new TextDecoder();
	let buffer = '';

	const flush = () => {
		let index = buffer.indexOf('\n');
		while (index >= 0) {
			const line = buffer.slice(0, index).trim();
			buffer = buffer.slice(index + 1);
			if (line) onMessage(JSON.parse(line) as StreamMessage);
			index = buffer.indexOf('\n');
		}
	};

	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		buffer += decoder.decode(value, { stream: true });
		flush();
	}

	buffer += decoder.decode();
	flush();
	const tail = buffer.trim();
	if (tail) onMessage(JSON.parse(tail) as StreamMessage);
}

export default function FFmpegClient() {
	const [file, setFile] = useState<File | null>(null);
	const [quality, setQuality] = useState<QualityKey>('balanced');
	const [maxHeight, setMaxHeight] = useState(1080);
	const [stage, setStage] = useState<Stage>('idle');
	const [percent, setPercent] = useState(0);
	const [speed, setSpeed] = useState('');
	const [status, setStatus] = useState('');
	const [error, setError] = useState('');
	const [result, setResult] = useState<Result | null>(null);
	const [elapsed, setElapsed] = useState(0);
	const [recents, setRecents] = useState<RecentItem[]>([]);
	const [loadingRecents, setLoadingRecents] = useState(true);
	const abortRef = useRef<AbortController | null>(null);
	const startedAtRef = useRef(0);

	const running = stage === 'uploading' || stage === 'converting';

	const loadRecents = useCallback(async () => {
		setLoadingRecents(true);
		try {
			const response = await fetch('/api/slimVideo', { cache: 'no-store' });
			if (!response.ok) return;
			const data = (await response.json()) as { items?: RecentItem[] };
			setRecents(Array.isArray(data.items) ? data.items : []);
		} catch {
			// 列表拉取失败不影响压缩本身
		} finally {
			setLoadingRecents(false);
		}
	}, []);

	// 刷新页面后从服务端补回仍在保留期的结果
	useEffect(() => {
		void loadRecents();
	}, [loadRecents]);

	// 8GB 的片子上传要好几分钟，用计时器让用户确认任务还活着
	useEffect(() => {
		if (!running) return;
		const timer = setInterval(() => setElapsed(Date.now() - startedAtRef.current), 1000);
		return () => clearInterval(timer);
	}, [running]);

	function pickFile(event: React.ChangeEvent<HTMLInputElement>) {
		const next = event.target.files?.[0];
		event.target.value = '';

		if (!next) return;

		const dot = next.name.lastIndexOf('.');
		const ext = dot >= 0 ? next.name.slice(dot).toLowerCase() : '';
		if (!next.type.startsWith('video/') && !VIDEO_EXT.includes(ext)) {
			setError('请选择视频文件（mp4 / mov / mkv / avi / webm 等）');
			return;
		}
		if (next.size > MAX_SIZE) {
			setError(`文件超过 ${MAX_SIZE / 1024 ** 3}GB，请先分段处理`);
			return;
		}

		setFile(next);
		setStage('idle');
		setResult(null);
		setError('');
		setPercent(0);
		setSpeed('');
		setStatus('');
	}

	async function start() {
		if (!file) return;

		const controller = new AbortController();
		abortRef.current = controller;

		setStage('uploading');
		setPercent(0);
		setSpeed('');
		setError('');
		setResult(null);
		setStatus('正在上传视频…');
		startedAtRef.current = Date.now();
		setElapsed(0);

		try {
			const query = new URLSearchParams({ name: file.name, quality, height: String(maxHeight) });
			const response = await fetch(`/api/slimVideo?${query.toString()}`, {
				method: 'POST',
				body: file,
				signal: controller.signal,
				headers: { 'Content-Type': file.type || 'application/octet-stream' }
			});

			if (!response.ok || !response.body) {
				const data = (await response.json().catch(() => null)) as { error?: string } | null;
				throw new Error(data?.error ?? `请求失败（${response.status}）`);
			}

			setStage('converting');
			setStatus('正在分析视频…');

			await readNdjson(response.body, (message) => {
				if (message.type === 'meta') {
					setStatus('正在压缩…');
				} else if (message.type === 'progress') {
					setPercent(message.percent);
					setSpeed(message.speed);
				} else if (message.type === 'done') {
					setPercent(100);
					setResult(message);
					setStage('done');
					setStatus('压缩完成');
					setRecents((previous) => [
						{
							id: message.id,
							name: message.name,
							size: message.size,
							originalSize: message.originalSize,
							createdAt: Date.now()
						},
						...previous.filter((item) => item.id !== message.id)
					]);
				} else if (message.type === 'error') {
					throw new Error(message.message);
				}
			});
		} catch (err) {
			if (controller.signal.aborted) {
				setStage('idle');
				setStatus('已取消');
				return;
			}
			setStage('idle');
			setStatus('');
			setError(err instanceof Error ? err.message : '压缩失败');
		} finally {
			abortRef.current = null;
		}
	}

	function cancel() {
		abortRef.current?.abort();
	}

	function reset() {
		setFile(null);
		setStage('idle');
		setResult(null);
		setError('');
		setPercent(0);
		setSpeed('');
		setStatus('');
		setElapsed(0);
	}

	const saved =
		result && result.originalSize > 0
			? Math.max(0, Math.round((1 - result.size / result.originalSize) * 100))
			: null;

	const visibleRecents = recents.filter((item) => Date.now() - item.createdAt < RETENTION_MS);

	return (
		<div className="mx-auto mt-20 mb-20 w-full max-w-xl px-5">
			<h1 className="text-center text-2xl font-bold text-black">视频压缩</h1>
			<p className="text-center text-stone-700">服务端 FFmpeg 转码，文件处理完即从服务器删除</p>

			<div className="mt-6 rounded-xl bg-white p-5 shadow-sm">
				{file ? (
					<div className="flex items-center justify-between gap-3">
						<div className="min-w-0">
							<p className="truncate font-medium text-[#33333b]">{file.name}</p>
							<p className="text-sm text-stone-500">{formatBytes(file.size)}</p>
						</div>
						<button
							type="button"
							onClick={reset}
							disabled={running}
							className="shrink-0 rounded border border-[#d6d6df] px-3 py-1.5 text-sm text-stone-600 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
						>
							重新选择
						</button>
					</div>
				) : (
					<label
						htmlFor="slimVideo"
						className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[#d6d6df] px-4 py-10 text-center transition-colors hover:border-blue-400 hover:text-blue-600"
					>
						<span className="text-base text-stone-600">点击选择视频文件</span>
						<span className="text-xs text-stone-400">支持 mp4 / mov / mkv / avi / webm，单文件 ≤ 8GB</span>
					</label>
				)}

				<input
					id="slimVideo"
					type="file"
					accept="video/*,.mkv,.ts,.mts"
					className="hidden"
					onChange={pickFile}
					disabled={running}
				/>

				<div className="mt-5 space-y-3">
					<div>
						<p className="mb-2 text-sm text-stone-600">压缩质量</p>
						<div className="grid grid-cols-3 gap-2">
							{QUALITIES.map((item) => (
								<button
									key={item.value}
									type="button"
									disabled={running}
									onClick={() => setQuality(item.value)}
									className={`rounded-lg border px-2 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
										quality === item.value
											? 'border-blue-500 bg-blue-50 text-blue-600'
											: 'border-[#d6d6df] text-stone-600 hover:border-blue-300'
									}`}
								>
									<span className="block">{item.label}</span>
									<span className="block text-xs text-stone-400">{item.note}</span>
								</button>
							))}
						</div>
					</div>

					<div>
						<p className="mb-2 text-sm text-stone-600">分辨率上限</p>
						<div className="grid grid-cols-4 gap-2">
							{HEIGHTS.map((item) => (
								<button
									key={item.value}
									type="button"
									disabled={running}
									onClick={() => setMaxHeight(item.value)}
									className={`rounded-lg border px-2 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
										maxHeight === item.value
											? 'border-blue-500 bg-blue-50 text-blue-600'
											: 'border-[#d6d6df] text-stone-600 hover:border-blue-300'
									}`}
								>
									{item.label}
								</button>
							))}
						</div>
					</div>
				</div>

				{stage !== 'idle' && (
					<div className="mt-5">
						<div className="h-2.5 overflow-hidden rounded-full bg-gray-200">
							<div
								className={`h-2.5 rounded-full bg-linear-to-r from-green-500 to-blue-500 ${
									stage === 'uploading' ? 'w-1/3 animate-pulse' : 'transition-[width] duration-300'
								}`}
								style={stage === 'uploading' ? undefined : { width: `${percent}%` }}
							/>
						</div>
						<div className="mt-2 flex justify-between text-xs text-stone-500">
							<span>{status}</span>
							<span>
								{stage === 'converting' && `${percent.toFixed(1)}%`}
								{stage === 'converting' && speed ? ` · ${speed}` : ''}
								{running ? ` · 已用 ${formatElapsed(elapsed)}` : ''}
							</span>
						</div>
					</div>
				)}

				{result && stage === 'done' && (
					<div className="mt-4 rounded-lg bg-green-50 px-3 py-3 text-sm text-green-800">
						<p>
							{formatBytes(result.originalSize)} → {formatBytes(result.size)}
							{saved !== null ? `（省 ${saved}%）` : ''}
						</p>
						<a
							href={`/api/slimVideo/${result.id}`}
							download={result.name}
							className="mt-2 inline-block rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
						>
							下载压缩后的视频
						</a>
					</div>
				)}

				{error && <p className="mt-4 rounded bg-red-50 px-3 py-2 text-sm break-all text-red-600">{error}</p>}

				<div className="mt-5">
					{running ? (
						<button
							type="button"
							onClick={cancel}
							className="w-full rounded border border-red-300 px-4 py-2 text-red-600 hover:bg-red-50"
						>
							取消
						</button>
					) : (
						<button
							type="button"
							onClick={start}
							disabled={!file}
							className="w-full rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{stage === 'done' ? '再压缩一次' : '开始压缩'}
						</button>
					)}
				</div>

				<p className="mt-4 text-center text-xs text-stone-400">
					需要服务器安装 FFmpeg；压缩结果在服务器保留 1 小时，请及时下载
				</p>
			</div>

			<div className="mt-6">
				<div className="mb-2 flex items-center justify-between">
					<h2 className="text-sm font-medium text-stone-600">最近压缩（保留 1 小时）</h2>
					<button
						type="button"
						onClick={loadRecents}
						disabled={loadingRecents}
						className="text-xs text-blue-600 hover:underline disabled:text-stone-400"
					>
						刷新
					</button>
				</div>

				{visibleRecents.length === 0 ? (
					<p className="rounded-xl bg-white px-4 py-4 text-center text-sm text-stone-400">
						{loadingRecents ? '正在读取…' : '还没有可下载的结果'}
					</p>
				) : (
					<ul className="divide-y divide-[#ececf2] overflow-hidden rounded-xl bg-white">
						{visibleRecents.map((item) => {
							const saveRate =
								item.originalSize && item.originalSize > 0
									? Math.max(0, Math.round((1 - item.size / item.originalSize) * 100))
									: null;

							return (
								<li key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
									<div className="min-w-0">
										<p className="truncate text-sm text-[#33333b]">{item.name}</p>
										<p className="mt-0.5 text-xs text-stone-400">
											{formatBytes(item.size)}
											{saveRate !== null ? `（省 ${saveRate}%）` : ''} ·{' '}
											{new Date(item.createdAt).toLocaleTimeString('zh-CN', {
												hour: '2-digit',
												minute: '2-digit'
											})}
										</p>
									</div>
									<a
										href={`/api/slimVideo/${item.id}`}
										download={item.name}
										className="shrink-0 rounded border border-blue-200 px-3 py-1 text-xs text-blue-600 hover:bg-blue-50"
									>
										下载
									</a>
								</li>
							);
						})}
					</ul>
				)}
			</div>
		</div>
	);
}
