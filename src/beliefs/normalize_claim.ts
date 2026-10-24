export function normalizeClaim(claim: string): string {
	return claim
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, ' ')
		.trim();
}
