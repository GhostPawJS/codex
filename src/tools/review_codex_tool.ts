import type { FlagResultItem, LogRecord, StatusRecord, TrendRecord } from '../beliefs/types.ts';
import type { CodexDb } from '../database.ts';
import * as read from '../read.ts';

import { translateToolError } from './tool_errors.ts';
import { defineCodexTool, enumSchema, integerSchema, objectSchema } from './tool_metadata.ts';
import { reviewCodexToolName } from './tool_names.ts';
import { inspectItemNext, reviseNext } from './tool_next.ts';
import { toBeliefIdRef } from './tool_ref.ts';
import type { ToolEntityRef, ToolNextStepHint, ToolResult } from './tool_types.ts';
import { toolSuccess, toolWarning } from './tool_types.ts';

type ReviewCodexView = 'flags' | 'log' | 'status' | 'trends';

type ReviewCodexPayload =
	| { view: 'flags'; data: FlagResultItem[] }
	| { view: 'log'; data: LogRecord[] }
	| { view: 'status'; data: StatusRecord }
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

function buildStatusResult(db: CodexDb, now?: number): ReviewCodexToolResult {
	const data = read.getStatus(db, now);
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

export function reviewCodexToolHandler(
	db: CodexDb,
	input: { view: ReviewCodexView; limit?: number; now?: number },
): ReviewCodexToolResult {
	try {
		switch (input.view) {
			case 'flags':
				return buildFlagsResult(db, input.now);
			case 'log':
				return buildLogResult(db, input.limit);
			case 'status':
				return buildStatusResult(db, input.now);
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
		'Load a codex review surface: flags for beliefs needing attention, status for portfolio health, log for recent activity, or trends for time-based patterns.',
	whenToUse:
		'Use this when you need an overview of the codex state rather than a specific belief. Start with flags for maintenance, status for a dashboard, or log for recent changes.',
	whenNotToUse:
		'Do not use this to find a specific belief by topic — use search_codex instead. Do not use this to inspect one belief deeply — use inspect_codex_item.',
	sideEffects: 'none',
	readOnly: true,
	supportsClarification: false,
	targetKinds: ['belief'],
	inputDescriptions: {
		view: 'Which review surface: flags, status, log, or trends.',
		limit: 'Maximum entries for the log view. Defaults to 20.',
		now: 'Optional timestamp override for freshness computation in flags and status.',
	},
	outputDescription:
		'One review surface payload. Flags include reason codes and review priority. Status includes integrity, distributions, and averages. Log includes typed entries. Trends include growing categories and calibration alerts.',
	inputSchema: objectSchema(
		{
			view: enumSchema(['flags', 'status', 'log', 'trends'], 'Which codex review surface to load.'),
			limit: integerSchema('Maximum entries for the log view.'),
			now: integerSchema('Optional timestamp override for freshness computation.'),
		},
		['view'],
		'Load a codex review surface.',
	),
	handler: reviewCodexToolHandler,
});
