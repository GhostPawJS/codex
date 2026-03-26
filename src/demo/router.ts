import { useEffect, useState } from 'preact/hooks';

export function navigate(path: string): void {
	location.hash = path;
}

export function useCurrentRoute(): string {
	const [route, setRoute] = useState(() => location.hash.replace(/^#\/?/, '') || '');
	useEffect(() => {
		const handler = () => setRoute(location.hash.replace(/^#\/?/, '') || '');
		window.addEventListener('hashchange', handler);
		return () => window.removeEventListener('hashchange', handler);
	}, []);
	return route;
}

export function parseDetailId(route: string): number | null {
	const match = route.match(/^detail\/(\d+)$/);
	return match ? Number(match[1]) : null;
}
