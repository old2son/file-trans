'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

type ModalOptions = {
	title?: string;
	showTitle?: boolean;
	content?: React.ReactNode | string;
	cancelText?: string;
	showCancel?: boolean;
};

let externalOpen: ((p: ModalOptions) => void) | null = null;
let externalClose: () => void;

export default function GlobalModal() {
	const [isOpen, setIsOpen] = useState(false);
	const [props, setProps] = useState<ModalOptions | null>(null);
	const [mounted, setMounted] = useState(false);
	const timeId = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		externalOpen = (p: ModalOptions) => {
			setProps(p);
			setMounted(true);
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
			<div className="absolute inset-0 bg-black/50 " onClick={closeModal} />

			{/* 内容容器 */}
			<div
				className={`relative bg-white rounded-xl p-6 shadow-lg max-w-[90%] max-h-[80%] overflow-auto transition-transform duration-200 ${
					isOpen ? 'scale-100' : 'scale-95'
				}`}
			>
				{props?.showTitle && <h2 className="mb-4 text-xl font-bold ">{props?.title || '提示'}</h2>}
				{props?.content || ''}
				{props?.showCancel && (
					<button onClick={closeModal} className="px-4 py-2 w-full bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer">
						{props?.cancelText || '确认'}
					</button>
				)}
			</div>
		</div>
	);

	return createPortal(modal, document.body);
}

export function openModal({ ...params }: Readonly<ModalOptions>) {
	externalOpen?.(params);
}

export function closeModal() {
	externalClose?.();
}
