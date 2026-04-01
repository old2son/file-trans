const api = process.env.NEXT_PUBLIC_API_URL;
export function track() {
	return fetch(`${api}/visit`);
}
