const api = process.env.NEXT_PUBLIC_API_URL;

export function track() {
	// 访问统计失败不应该影响页面：本地没起服务、走代理被拦都会走到这里
	if (!api) return Promise.resolve();
	return fetch(`${api}/visit`).catch(() => undefined);
}
