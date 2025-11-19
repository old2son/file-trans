'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { closeModal } from '@/components/GlobalModal';

export default function RouteWatcher() {
	const pathname = usePathname();
	const searchParams = useSearchParams();

	useEffect(() => {
		// 路由变化自动关闭弹窗
		closeModal();
	}, [pathname, searchParams]); // 监听路径和参数变化

	return null;
}
