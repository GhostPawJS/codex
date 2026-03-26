import type { BeliefCategory } from '../beliefs/types.ts';

const MINUTE = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

export function relativeTime(ts: number): string {
	const diff = Date.now() - ts;
	if (diff < MINUTE) return 'just now';
	if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m ago`;
	if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`;
	const days = Math.floor(diff / DAY);
	if (days === 1) return '1 day ago';
	if (days < 30) return `${days} days ago`;
	const months = Math.floor(days / 30);
	return months === 1 ? '1 month ago' : `${months} months ago`;
}

export function percent(n: number): string {
	return `${Math.round(n)}%`;
}

const CATEGORY_KEYWORDS: Array<{ pattern: RegExp; category: BeliefCategory }> = [
	{ pattern: /\b(prefer|like|dislike|favor|enjoy|hate)\b/i, category: 'preference' },
	{ pattern: /^how to\b|^steps to\b|^always\b|^never\b/i, category: 'procedure' },
	{ pattern: /\b(can|support|capable|enable|allow)\b/i, category: 'capability' },
];

export function suggestCategory(claim: string): BeliefCategory | null {
	for (const { pattern, category } of CATEGORY_KEYWORDS) {
		if (pattern.test(claim)) return category;
	}
	return null;
}
