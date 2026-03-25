export function canonicalizeBeliefPair(a: number, b: number): [number, number] {
	if (a === b) {
		throw new Error('Dismissal pairs must reference two distinct beliefs.');
	}
	return a < b ? [a, b] : [b, a];
}
