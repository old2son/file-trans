import type { NextConfig } from 'next';
import os from 'os';
import path from 'path';

function getLocalIPList(): string[] {
	const nets = os.networkInterfaces();
	const results: string[] = [];

	for (const name of Object.keys(nets)) {
		for (const net of nets[name] || []) {
			if (net.family === 'IPv4' && !net.internal) {
				results.push(net.address);
			}
		}
	}
	return results;
}

const ip = getLocalIPList();

const nextConfig: NextConfig = {
	async redirects() {
		return [
			{
				source: '/',
				destination: '/filesGround',
				permanent: true, // 或 false（临时重定向）
			},
		];
	},
	// 资源别名设置，需要配合tsconfig.json修改
	turbopack: {
		resolveAlias: {
			'@': path.resolve(process.cwd(), 'src'),
		},
	},
	// 跨域访问设置
	allowedDevOrigins: [...ip],
	// 严格模式，useEffect 等会执行两次
	// reactStrictMode: false,
};

export default nextConfig;
