'use client';

export default function LoadingBar({ progress, className = '' }: { progress: number; className?: string }) {
	return (
		<div className={`h-4 overflow-hidden rounded-full bg-gray-200 ${className}`}>
			<div className="h-4 transition-[width] animate-pulse rounded-full bg-linear-to-r from-green-500 to-blue-500" style={{ width: `${progress * 100}%` }}></div>
		</div>
	);
}
