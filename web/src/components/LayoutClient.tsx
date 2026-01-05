'use client';

import { useEffect, useState } from 'react';
import setRem from '@/lib/rem';

export default function LayoutClient({ children }: { children: React.ReactNode }) {
	const [mounted, setMounted] = useState(false);

	const onSetRem = () => { 
		setRem();
	}

	useEffect(() => {
		setRem(() => {
			setMounted(true);
		});
		window.addEventListener('resize', onSetRem);
		return () => window.removeEventListener('resize', onSetRem);
	}, []);

	return mounted ? children : null;
}
