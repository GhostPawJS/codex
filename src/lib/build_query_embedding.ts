import { normalizeVector } from './normalize_vector.ts';

const DEFAULT_DIMENSION = 256;

function hash(text: string): number {
	let value = 2166136261;
	for (let index = 0; index < text.length; index += 1) {
		value ^= text.charCodeAt(index);
		value = Math.imul(value, 16777619);
	}
	return value >>> 0;
}

function normalizeText(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, ' ')
		.trim();
}

export function buildQueryEmbedding(text: string, dimension = DEFAULT_DIMENSION): Float32Array {
	const normalized = normalizeText(text);
	const buckets = new Array<number>(dimension).fill(0);
	for (const token of normalized.split(/\s+/).filter(Boolean)) {
		const tokenBucket = hash(token) % dimension;
		buckets[tokenBucket] = (buckets[tokenBucket] ?? 0) + 2;
		for (let index = 0; index < token.length - 2; index += 1) {
			const trigram = token.slice(index, index + 3);
			const trigramBucket = hash(`tri:${trigram}`) % dimension;
			buckets[trigramBucket] = (buckets[trigramBucket] ?? 0) + 1;
		}
	}
	return normalizeVector(buckets);
}
