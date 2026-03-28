import type { CodexDb } from '../database.ts';
import { buildQueryEmbedding } from '../lib/build_query_embedding.ts';
import { deserializeVectorBlob } from '../lib/deserialize_vector_blob.ts';
import { hybridRecall } from '../lib/hybrid_recall.ts';
import { computeRecallWeight } from '../lib/recall_weight.ts';
import { resolveNow } from '../resolve_now.ts';

import { mapBeliefRow } from './map_belief_row.ts';
import type { BeliefRow, RecallOptions, RecallResultItem } from './types.ts';

function tokenizeQuery(query: string): string[] {
	return query
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, ' ')
		.trim()
		.split(/\s+/)
		.filter(Boolean);
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

function fetchLexicalCandidateIds(db: CodexDb, query: string, limit: number): Map<number, number> {
	const tokens = tokenizeQuery(query);
	if (tokens.length === 0) {
		return new Map();
	}
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
	if (ids && ids.length === 0) {
		return [];
	}
	if (!ids) {
		return db
			.prepare('SELECT * FROM beliefs WHERE superseded_by IS NULL ORDER BY verified_at DESC')
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

	const tokens = tokenizeQuery(query);
	if (tokens.length === 0) {
		return [];
	}

	const totalActive = Number(
		db.prepare('SELECT COUNT(*) AS count FROM beliefs WHERE superseded_by IS NULL').get()?.count ??
			0,
	);
	if (totalActive === 0) {
		return [];
	}

	const candidateCap = 300;
	const lexicalRanks = fetchLexicalCandidateIds(db, query, candidateCap);
	let rows =
		lexicalRanks.size === 0
			? loadActiveBeliefRows(db)
			: loadActiveBeliefRows(db, [...lexicalRanks.keys()]);
	if (lexicalRanks.size === 0 && rows.length > candidateCap) {
		rows = rows.slice(0, candidateCap);
	}
	rows = rows.filter(
		(row) =>
			(!options.category || row.category === options.category) &&
			(!options.source || row.source === options.source),
	);
	if (rows.length === 0) {
		return [];
	}
	const queryVector = buildQueryEmbedding(query);
	return hybridRecall(
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
		limit,
		minScore,
	).map((result) => ({
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
