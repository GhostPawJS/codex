export interface FusionScoreInput {
	lexicalRank?: number | null | undefined;
	semanticRank?: number | null | undefined;
	recallWeight: number;
	rrfK?: number | undefined;
}

function rankToRrf(rank: number | null | undefined, rrfK: number): number {
	if (rank === null || rank === undefined || rank < 1) {
		return 0;
	}
	return 1 / (rrfK + rank);
}

export function computeFusionScore(input: FusionScoreInput) {
	const rrfK = input.rrfK ?? 10;
	const lexical = rankToRrf(input.lexicalRank, rrfK);
	const semantic = rankToRrf(input.semanticRank, rrfK);
	return {
		lexical,
		semantic,
		combined: (lexical + semantic) * input.recallWeight,
	};
}
