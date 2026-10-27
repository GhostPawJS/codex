import type { CodexDb } from '../database.ts';
import { buildQueryEmbedding } from '../lib/build_query_embedding.ts';
import { deserializeVectorBlob } from '../lib/deserialize_vector_blob.ts';
import { hybridRecall } from '../lib/hybrid_recall.ts';
import { computeRecallWeight } from '../lib/recall_weight.ts';
import { resolveNow } from '../resolve_now.ts';
import { expandQuery } from './expand_query.ts';
import { mapBeliefRow } from './map_belief_row.ts';
import { normalizeClaim } from './normalize_claim.ts';
import { queryTokenWeights } from './query_token_weights.ts';
import type { BeliefRow, RecallOptions, RecallResultItem } from './types.ts';

function tokenizeQuery(query: string): string[] {
	return normalizeClaim(query).split(/\s+/).filter(Boolean);
}

function safeFtsQuery(db: CodexDb, ftsExpr: string, limit: number): { id: number }[] {
	try {
		return db
			.prepare(
				`SELECT rowid AS id FROM beliefs_fts WHERE beliefs_fts MATCH ? ORDER BY bm25(beliefs_fts) LIMIT ?`,
			)
			.all<{ id: number }>(ftsExpr, limit);
	} catch {
		return [];
	}
}

function fetchLexicalCandidateIds(
	db: CodexDb,
	tokens: readonly string[],
	limit: number,
): Map<number, number> {
	const searches = [
		`"${tokens.join(' ')}"`,
		tokens.join(' '),
		tokens.map((token) => `${token}*`).join(' OR '),
	];
	const ranks = new Map<number, number>();
	for (const search of searches) {
		const rows = safeFtsQuery(db, search, limit);
		for (const [index, row] of rows.entries()) {
			const rank = index + 1;
			const previous = ranks.get(row.id);
			if (previous === undefined || rank < previous) {
				ranks.set(row.id, rank);
			}
		}
	}
	return ranks;
}

function loadActiveBeliefRows(db: CodexDb, ids?: readonly number[]): BeliefRow[] {
	if (!ids) {
		return db
			.prepare(
				'SELECT * FROM beliefs WHERE superseded_by IS NULL ORDER BY verified_at DESC LIMIT 300',
			)
			.all<BeliefRow>();
	}
	const placeholders = ids.map(() => '?').join(', ');
	return db
		.prepare(`SELECT * FROM beliefs WHERE superseded_by IS NULL AND id IN (${placeholders})`)
		.all<BeliefRow>(...ids);
}

export function recall(
	db: CodexDb,
	query: string,
	options: RecallOptions = {},
): RecallResultItem[] {
	const now = resolveNow(options.now);
	const limit = options.limit ?? 20;
	const minScore = options.minScore ?? 0.01;

	const tokens = tokenizeQuery(expandQuery(query));
	if (tokens.length === 0) {
		return [];
	}

	if (!db.prepare('SELECT 1 FROM beliefs WHERE superseded_by IS NULL LIMIT 1').get()) return [];

	const candidateCap = 300;
	const { weights, informative, commonOnly } = queryTokenWeights(db, query);
	const lexicalRanks = fetchLexicalCandidateIds(
		db,
		informative.length && !commonOnly ? informative : tokens,
		candidateCap,
	);
	let rows =
		lexicalRanks.size === 0
			? loadActiveBeliefRows(db)
			: loadActiveBeliefRows(db, [...lexicalRanks.keys()]);
	rows = rows.filter(
		(row) =>
			(!options.category || row.category === options.category) &&
			(!options.source || row.source === options.source),
	);
	if (rows.length === 0) {
		return [];
	}
	const queryVector = buildQueryEmbedding(query, 256, weights);
	const ranked = hybridRecall(
		queryVector,
		rows.map((row) => {
			const record = mapBeliefRow(row, now);
			return {
				id: row.id,
				value: { row, record },
				vector: deserializeVectorBlob(row.embedding),
				lexicalRank: lexicalRanks.get(row.id) ?? null,
				recallWeight: computeRecallWeight(record.certainty, record.freshness, record.evidence),
			};
		}),
		candidateCap,
		minScore,
	);
	const signal = (result: (typeof ranked)[number]) => {
		const claim = normalizeClaim(result.value.row.claim).split(/\s+/);
		const coverage =
			tokens.reduce(
				(sum, token) =>
					sum + (claim.some((word) => word.startsWith(token)) ? (weights.get(token) ?? 1) : 0),
				0,
			) / [...weights.values()].reduce((a, b) => a + b, 1e-9);
		return coverage + Math.max(0, result.semanticSimilarity);
	};
	const best = Math.max(0, ...ranked.map(signal));
	return ranked
		.filter((result) => commonOnly || signal(result) >= best * 0.55)
		.sort((a, b) =>
			// With no informative lexical match, avoid promoting weak hash collisions.
			commonOnly
				? (a.lexicalRank ?? Infinity) - (b.lexicalRank ?? Infinity) || a.id - b.id
				: signal(b) - signal(a) || b.finalScore - a.finalScore || a.id - b.id,
		)
		.slice(0, commonOnly ? Math.min(limit, 3) : limit)
		.map((result) => ({
			...result.value.record,
			recallScore: result.finalScore,
			scoreParts: {
				lexicalRank: result.lexicalRank,
				semanticRank: result.semanticRank,
				lexicalRrf: result.lexicalRrf,
				semanticRrf: result.semanticRrf,
				semanticSimilarity: result.semanticSimilarity,
				recallWeight: result.recallWeight,
				finalScore: result.finalScore,
			},
		}));
}
