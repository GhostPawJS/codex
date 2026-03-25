export function normalizeVector(values: readonly number[]): Float32Array {
	const vector = new Float32Array(values);
	let norm = 0;
	for (const value of vector) {
		norm += value * value;
	}
	if (norm === 0) {
		return vector;
	}
	const scale = 1 / Math.sqrt(norm);
	for (let index = 0; index < vector.length; index += 1) {
		vector[index] = (vector[index] ?? 0) * scale;
	}
	return vector;
}
