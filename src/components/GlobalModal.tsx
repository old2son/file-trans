'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

let externalOpen: (content: React.ReactNode) => void;
let externalClose: () => void;

export default function GlobalModal() {
	const [isOpen, setIsOpen] = useState(false);
	const [content, setContent] = useState<React.ReactNode>(null);
	const [mounted, setMounted] = useState(false);
	const timeId = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		externalOpen = (c: React.ReactNode) => {
			setContent(c);
			setMounted(true);
			setIsOpen(true);
			if (timeId.current) clearTimeout(timeId.current);
			timeId.current = setTimeout(() => setIsOpen(true), 20);
		};

		externalClose = () => {
			setIsOpen(false);
			if (timeId.current) clearTimeout(timeId.current);
		};
	}, []);

	if (!mounted) return null;

	const modal = (
		<div
			className={`fixed inset-0 z-99 flex items-center justify-center transition-all duration-200
                ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
            `}
		>
			{/* 背景 */}
			<div className="absolute inset-0 bg-black/50 " onClick={() => setIsOpen(false)} />

			{/* 内容容器 */}
			<div
				className={`relative bg-white rounded-xl p-6 shadow-lg max-w-[90%] max-h-[80%] overflow-auto transition-transform duration-200 ${
					isOpen ? 'scale-100' : 'scale-95'
				}`}
			>
				{content}
			</div>
		</div>
	);

	return createPortal(modal, document.body);
}

export function openModal(content: React.ReactNode) {
	externalOpen?.(content);
}

export function closeModal() {
	externalClose?.();
}
