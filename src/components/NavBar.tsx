'use client';

import { useState } from 'react';

export default function NavBar({ logo, menu, mobileMenu }: { logo?: React.ReactNode; menu?: React.ReactNode; mobileMenu?: React.ReactNode }) {
	const [open, setOpen] = useState(false);

	return (
		<nav className="fixed top-0 z-5 px-4 py-2 w-full shadow bg-white">
			<div className="max-w-7xl mx-auto flex items-center justify-between">
				{logo || <div className="text-xl font-bold">LOGO</div>}

				<div className="hidden md:flex space-x-6">
					{menu || (
						<>
							<a href="/" className="text-gray-700 hover:text-black">
								首页
							</a>
							<a href="/tools" className="text-gray-700 hover:text-black">
								工具
							</a>
							<a href="/about" className="text-gray-700 hover:text-black">
								关于
							</a>
						</>
					)}
				</div>

				<button onClick={() => setOpen(!open)} className="cursor-pointer md:hidden text-gray-700 focus:outline-none">
					<svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2}>
						<path d="M4 6h16M4 12h16M4 18h16" />
					</svg>
				</button>
			</div>

			{open && (
				<div className="md:hidden mt-2 space-y-2">
					{mobileMenu || (
						<>
							<a href="/" className="block px-2 py-1 text-gray-700 hover:bg-gray-100 rounded">
								首页
							</a>
							<a href="/tools" className="block px-2 py-1 text-gray-700 hover:bg-gray-100 rounded">
								工具
							</a>
							<a href="/about" className="block px-2 py-1 text-gray-700 hover:bg-gray-100 rounded">
								关于
							</a>
						</>
					)}
				</div>
			)}
		</nav>
	);
}
