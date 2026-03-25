const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function computeFreshness(
	verifiedAt: number,
	now: number,
	evidence: number,
	halfLifeDays = 90,
): number {
	const ageDays = Math.max(0, now - verifiedAt) / MS_PER_DAY;
	const inertia = Math.sqrt(Math.max(1, evidence));
	return Math.exp(-ageDays / (halfLifeDays * inertia));
}
