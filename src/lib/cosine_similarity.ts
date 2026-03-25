export function cosineSimilarity(a: Float32Array | null, b: Float32Array | null): number {
	if (a === null || b === null || a.length === 0 || a.length !== b.length) {
		return 0;
	}
	let dot = 0;
	let normA = 0;
	let normB = 0;
	for (let index = 0; index < a.length; index += 1) {
		const valueA = a[index] ?? 0;
		const valueB = b[index] ?? 0;
		dot += valueA * valueB;
		normA += valueA * valueA;
		normB += valueB * valueB;
	}
	if (normA === 0 || normB === 0) {
		return 0;
	}
	return dot / Math.sqrt(normA * normB);
}
