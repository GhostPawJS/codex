import type { CodexDb } from '../database.ts';
import { CodexValidationError } from '../errors.ts';
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

function nearToken(a: string, b: string): boolean {
	if (a.length < 4 || b.length < 4) return false;
	const bound = Math.min(2, Math.floor(Math.max(a.length, b.length) / 4));
	if (Math.abs(a.length - b.length) > bound) return false;
	let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
	for (let i = 1; i <= a.length; i++) {
		const current = [i];
		for (let j = 1; j <= b.length; j++)
			current[j] = Math.min(
				(current[j - 1] ?? 0) + 1,
				(previous[j] ?? 0) + 1,
				(previous[j - 1] ?? 0) + (a[i - 1] === b[j - 1] ? 0 : 1),
			);
		previous = current;
	}
	return (previous[b.length] ?? Infinity) <= bound;
}

function quoteFts(text: string): string {
	return `"${text.replaceAll('"', '""')}"`;
}

function safeFtsQuery(db: CodexDb, ftsExpr: string, limit: number): { id: number }[] {
	try {
		return db
			.prepare(
				`SELECT beliefs_fts.rowid AS id FROM beliefs_fts CROSS JOIN beliefs ON beliefs.id = beliefs_fts.rowid WHERE beliefs_fts MATCH ? AND beliefs.superseded_by IS NULL ORDER BY bm25(beliefs_fts) LIMIT ?`,
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
	literalQuery: string,
): Map<number, number> {
	const searches = [
		quoteFts(tokens.join(' ')),
		literalQuery.trim().split(/\s+/).filter(Boolean).map(quoteFts).join(' '),
		tokens.map((token) => `${quoteFts(token)}*`).join(' OR '),
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

	const trimmed = query.trim();
	const phrase =
		!options.fts && trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"');
	const text = phrase ? trimmed.slice(1, -1) : query;
	const tokens = tokenizeQuery(expandQuery(db, text));
	const leadingTokens = tokenizeQuery(text);
	const matchesEntity = (claim: string): boolean => {
		if (options.fts || phrase) return false;
		const colon = claim.indexOf(':');
		if (colon < 0) return false;
		const entity = tokenizeQuery(claim.slice(0, colon));
		return entity.length > 0 && entity.every((token, i) => token === leadingTokens[i]);
	};
	let exactRanks: Map<number, number> | undefined;
	if (options.fts || phrase) {
		try {
			const expression = options.fts ? query : quoteFts(text);
			const matches = db
				.prepare(
					'SELECT rowid AS id FROM beliefs_fts WHERE beliefs_fts MATCH ? ORDER BY bm25(beliefs_fts)',
				)
				.all<{ id: number }>(expression);
			exactRanks = new Map(matches.map((row, i) => [row.id, i + 1]));
		} catch {
			throw new CodexValidationError(`Invalid FTS query ${JSON.stringify(query)}.`);
		}
	}
	if (tokens.length === 0) {
		return [];
	}

	if (!db.prepare('SELECT 1 FROM beliefs WHERE superseded_by IS NULL LIMIT 1').get()) return [];

	const candidateCap = 300;
	const { weights, informative, commonOnly } = queryTokenWeights(db, query);
	const lexicalRanks =
		exactRanks ??
		fetchLexicalCandidateIds(
			db,
			informative.length && !commonOnly ? informative : tokens,
			candidateCap,
			text,
		);
	let rows =
		!exactRanks && lexicalRanks.size === 0
			? loadActiveBeliefRows(db).filter((row) =>
					tokens.some((token) => tokenizeQuery(row.claim).some((word) => nearToken(token, word))),
				)
			: loadActiveBeliefRows(db, [...lexicalRanks.keys()]);
	if (!exactRanks) {
		const ids = new Set(rows.map((row) => row.id));
		for (const row of loadActiveBeliefRows(db)) {
			if (!ids.has(row.id) && matchesEntity(row.claim)) rows.push(row);
		}
	}
	rows = rows.filter(
		(row) =>
			(!options.category || row.category === options.category) &&
			(!options.source || row.source === options.source) &&
			(options.prefix === undefined ||
				row.claim.trimStart().toLowerCase().startsWith(options.prefix.toLowerCase())),
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
		.filter(
			(result) =>
				exactRanks ||
				matchesEntity(result.value.row.claim) ||
				commonOnly ||
				signal(result) >= best * 0.55,
		)
		.sort(
			(a, b) =>
				// With no informative lexical match, avoid promoting weak hash collisions.
				Number(matchesEntity(b.value.row.claim)) - Number(matchesEntity(a.value.row.claim)) ||
				(commonOnly
					? (a.lexicalRank ?? Infinity) - (b.lexicalRank ?? Infinity) || a.id - b.id
					: signal(b) - signal(a) || b.finalScore - a.finalScore || a.id - b.id),
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
