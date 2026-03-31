const api = process.env.NEXT_PUBLIC_API_URL;
console.log(api);
export function track() {
	return fetch(`${api}/visit`);
}
