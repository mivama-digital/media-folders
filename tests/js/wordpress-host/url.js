export function addQueryArgs(url, args = {}) {
	const [base, hash = ''] = String(url).split('#', 2);
	const parsed = new URL(base, 'https://example.test');
	for (const [key, value] of Object.entries(args)) {
		if (value === undefined || value === null) continue;
		parsed.searchParams.set(key, String(value));
	}
	const relative = `${parsed.pathname}${parsed.search}${hash ? `#${hash}` : ''}`;
	return /^https?:\/\//.test(base) ? parsed.toString() : relative;
}
