'use client';

import { useEffect } from 'react';
import { track } from '@/lib/track';

export default function Layout({ children }: { children: React.ReactNode }) {
	useEffect(() => {
		track();
	}, []);

	return <>{children}</>;
}
