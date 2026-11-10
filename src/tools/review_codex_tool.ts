import { normalizeClaim } from '../beliefs/normalize_claim.ts';
import type { FlagResultItem, LogRecord, StatusRecord, TrendRecord } from '../beliefs/types.ts';
import type { CodexDb } from '../database.ts';
import * as read from '../read.ts';
import { translateToolError } from './tool_errors.ts';
import {
	booleanSchema,
	defineCodexTool,
	enumSchema,
	integerSchema,
	objectSchema,
	stringSchema,
} from './tool_metadata.ts';
import { reviewCodexToolName } from './tool_names.ts';
import { inspectItemNext, reviseNext } from './tool_next.ts';
import { toBeliefIdRef } from './tool_ref.ts';
import type { ToolEntityRef, ToolNextStepHint, ToolResult } from './tool_types.ts';
import { toolSuccess, toolWarning } from './tool_types.ts';
import { validateToolInput } from './validate_tool_input.ts';

type ReviewCodexView = 'list' | 'flags' | 'log' | 'status' | 'trends' | 'duplicates';

type ReviewCodexPayload =
	| { view: 'list'; data: import('../beliefs/types.ts').BeliefRecord[] }
	| { view: 'flags'; data: FlagResultItem[] }
	| { view: 'log'; data: LogRecord[] }
	| { view: 'status'; data: StatusRecord & { prefixCounts?: { prefix: string; count: number }[] } }
	| {
			view: 'duplicates';
			data: {
				beliefA: number;
				beliefB: number;
				claimA: string;
				claimB: string;
				similarity: number;
			}[];
	  }
	| { view: 'trends'; data: TrendRecord };

export interface ReviewCodexToolData {
	payload: ReviewCodexPayload;
}

export type ReviewCodexToolResult = ToolResult<ReviewCodexToolData>;

function buildFlagsResult(db: CodexDb, now?: number): ReviewCodexToolResult {
	const data = read.listFlags(db, now);
	const entities: ToolEntityRef[] = data.slice(0, 5).map((f) => toBeliefIdRef(f.id, f.claim));
	const next: ToolNextStepHint[] = data
		.slice(0, 3)
		.flatMap((f) => [
			inspectItemNext(f.id, f.claim),
			reviseNext('confirm', f.id, `Confirm "${f.claim}" if it still holds.`),
		]);
	const warnings =
		data.length === 0
			? [toolWarning('empty_result', 'No beliefs need attention right now.')]
			: undefined;
	return toolSuccess(
		`${data.length} belief${data.length === 1 ? '' : 's'} flagged for review.`,
		{ payload: { view: 'flags', data } },
		{ entities, next, warnings },
	);
}

function buildLogResult(db: CodexDb, limit?: number): ReviewCodexToolResult {
	const data = read.listLog(db, limit);
	const entities = data.slice(0, 5).map((entry) => toBeliefIdRef(entry.id, entry.claim));
	return toolSuccess(
		`${data.length} recent log entries.`,
		{ payload: { view: 'log', data } },
		{
			entities,
		},
	);
}

function buildStatusResult(db: CodexDb, now?: number, byPrefix?: boolean): ReviewCodexToolResult {
	const data: StatusRecord & { prefixCounts?: { prefix: string; count: number }[] } =
		read.getStatus(db, now);
	if (byPrefix) {
		const counts = new Map<string, number>();
		for (const { claim } of db
			.prepare('SELECT claim FROM beliefs WHERE superseded_by IS NULL')
			.all<{ claim: string }>()) {
			const prefix = claim.includes(':') ? claim.slice(0, claim.indexOf(':')).trim() : '(none)';
			counts.set(prefix, (counts.get(prefix) ?? 0) + 1);
		}
		data.prefixCounts = [...counts]
			.map(([prefix, count]) => ({ prefix, count }))
			.sort((a, b) => b.count - a.count || a.prefix.localeCompare(b.prefix));
	}
	return toolSuccess(
		`Codex integrity: ${Math.round(data.integrity)}%. ${data.activeBeliefCount} active beliefs held.`,
		{ payload: { view: 'status', data } },
	);
}

function buildTrendsResult(db: CodexDb): ReviewCodexToolResult {
	const data = read.getTrends(db);
	const alerts = data.calibrationAlerts.length;
	return toolSuccess(
		alerts > 0
			? `${alerts} calibration alert${alerts === 1 ? '' : 's'}. ${data.growingCategories.length} growing categories.`
			: `${data.growingCategories.length} growing categories tracked.`,
		{ payload: { view: 'trends', data } },
	);
}

function buildDuplicatesResult(
	db: CodexDb,
	limit = 20,
	now?: number,
	crossEntity = false,
): ReviewCodexToolResult {
	const pairs: {
		beliefA: number;
		beliefB: number;
		claimA: string;
		claimB: string;
		similarity: number;
	}[] = [];
	const rows = db
		.prepare('SELECT id, claim FROM beliefs WHERE superseded_by IS NULL ORDER BY id')
		.all<{ id: number; claim: string }>();
	const prefix = (claim: string) =>
		claim.includes(':') ? normalizeClaim(claim.slice(0, claim.indexOf(':'))) : '';
	for (const row of rows) {
		for (const nearby of read.listBeliefProximity(db, row.id, rows.length, 0.7, now)) {
			if (row.id < nearby.id && (crossEntity || prefix(row.claim) === prefix(nearby.claim)))
				pairs.push({
					beliefA: row.id,
					beliefB: nearby.id,
					claimA: row.claim,
					claimB: nearby.claim,
					similarity: nearby.similarity,
				});
		}
	}
	const data = pairs
		.sort((a, b) => b.similarity - a.similarity || a.beliefA - b.beliefA || a.beliefB - b.beliefB)
		.slice(0, limit);
	return toolSuccess(`${data.length} near-duplicate pairs.`, {
		payload: { view: 'duplicates', data },
	});
}

export function reviewCodexToolHandler(
	db: CodexDb,
	input: {
		view: ReviewCodexView;
		topic?: string;
		limit?: number;
		now?: number;
		byPrefix?: boolean;
		crossEntity?: boolean;
	},
): ReviewCodexToolResult {
	const invalid = validateToolInput(reviewCodexTool.inputSchema, input);
	if (invalid) return invalid;
	try {
		switch (input.view) {
			case 'list': {
				const data = read.listBeliefs(db, input);
				return toolSuccess(`${data.length} active beliefs.`, { payload: { view: 'list', data } });
			}
			case 'flags':
				return buildFlagsResult(db, input.now);
			case 'log':
				return buildLogResult(db, input.limit);
			case 'status':
				return buildStatusResult(db, input.now, input.byPrefix);
			case 'duplicates':
				return buildDuplicatesResult(db, input.limit, input.now, input.crossEntity);
			case 'trends':
				return buildTrendsResult(db);
		}
	} catch (error) {
		return translateToolError(error, { summary: 'Could not load the codex review surface.' });
	}
}

export const reviewCodexTool = defineCodexTool<
	Parameters<typeof reviewCodexToolHandler>[1],
	ReviewCodexToolData
>({
	name: reviewCodexToolName,
	description:
		'Load a codex review surface: flags for beliefs needing attention, status for portfolio health, log for recent activity, trends for time-based patterns, or duplicates for nearby active pairs sharing a claim prefix (unprefixed claims pair together).',
	whenToUse:
		'Use this when you need an overview of the codex state rather than a specific belief. Start with flags for maintenance, status for a dashboard, or log for recent changes.',
	whenNotToUse:
		'Do not use this to find a specific belief by topic — use search_codex instead. Do not use this to inspect one belief deeply — use inspect_codex_item.',
	sideEffects: 'none',
	readOnly: true,
	supportsClarification: false,
	targetKinds: ['belief'],
	inputDescriptions: {
		view: 'Which review surface: flags, status, log, trends, or duplicates.',
		limit: 'Maximum entries for log or duplicates. Defaults to 20.',
		crossEntity: 'Include duplicate candidates across different claim prefixes. Defaults to false.',
		byPrefix: 'Include active claim prefix counts in status.',
		now: 'Optional timestamp override for freshness computation in flags and status.',
	},
	outputDescription:
		'One review surface payload. Flags include reason codes and review priority. Status includes integrity, distributions, and averages. Log includes typed entries. Trends include growing categories and calibration alerts.',
	inputSchema: objectSchema(
		{
			topic: stringSchema('Exact topic filter for list.'),
			view: enumSchema(
				['flags', 'status', 'log', 'trends', 'duplicates', 'list'],
				'Which codex review surface to load. Flags suppress single_evidence, low_trust and gap for beliefs created less than seven days ago.',
			),
			limit: integerSchema('Maximum entries for log or duplicates.'),
			crossEntity: booleanSchema(
				'Include duplicate candidates across different claim prefixes. Defaults to false.',
			),
			byPrefix: booleanSchema('Include active claim prefix counts in status.'),
			now: integerSchema('Optional timestamp override for freshness computation.'),
		},
		['view'],
		'Load a codex review surface.',
	),
	handler: reviewCodexToolHandler,
});
