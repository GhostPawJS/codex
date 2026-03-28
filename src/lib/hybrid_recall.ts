import { cosineSimilarity } from './cosine_similarity.ts';
import { computeFusionScore } from './fusion_score.ts';

export interface HybridRecallCandidate<TValue> {
	id: number;
	value: TValue;
	vector: Float32Array | null;
	lexicalRank: number | null;
	recallWeight: number;
}

export interface HybridRecallResult<TValue> {
	id: number;
	value: TValue;
	lexicalRank: number | null;
	semanticRank: number | null;
	semanticSimilarity: number;
	lexicalRrf: number;
	semanticRrf: number;
	recallWeight: number;
	finalScore: number;
}

export function hybridRecall<TValue>(
	queryVector: Float32Array | null,
	candidates: readonly HybridRecallCandidate<TValue>[],
	limit = 20,
	minScore = 0.01,
): HybridRecallResult<TValue>[] {
	const semanticRanks = [...candidates]
		.map((candidate) => ({
			id: candidate.id,
			similarity: cosineSimilarity(queryVector, candidate.vector),
		}))
		.sort((a, b) => b.similarity - a.similarity);
	const semanticRankMap = new Map<number, { rank: number; similarity: number }>();
	for (const [index, entry] of semanticRanks.entries()) {
		semanticRankMap.set(entry.id, { rank: index + 1, similarity: entry.similarity });
	}
	return candidates
		.map((candidate) => {
			const semantic = semanticRankMap.get(candidate.id) ?? { rank: null, similarity: 0 };
			const fusion = computeFusionScore({
				lexicalRank: candidate.lexicalRank,
				semanticRank: semantic.rank,
				recallWeight: candidate.recallWeight,
			});
			return {
				id: candidate.id,
				value: candidate.value,
				lexicalRank: candidate.lexicalRank,
				semanticRank: semantic.rank,
				semanticSimilarity: semantic.similarity,
				lexicalRrf: fusion.lexical,
				semanticRrf: fusion.semantic,
				recallWeight: candidate.recallWeight,
				finalScore: fusion.combined,
			};
		})
		.filter((candidate) => candidate.finalScore >= minScore)
		.sort((a, b) => b.finalScore - a.finalScore)
		.slice(0, limit);
}
