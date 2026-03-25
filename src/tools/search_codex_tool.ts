import type { RecallResultItem } from '../beliefs/types.ts';
import type { CodexDb } from '../database.ts';
import * as read from '../read.ts';

import { translateToolError } from './tool_errors.ts';
import {
	defineCodexTool,
	enumSchema,
	integerSchema,
	numberSchema,
	objectSchema,
	stringSchema,
} from './tool_metadata.ts';
import { searchCodexToolName } from './tool_names.ts';
import { inspectItemNext, reviewViewNext } from './tool_next.ts';
import { toBeliefIdRef } from './tool_ref.ts';
import type { ToolResult } from './tool_types.ts';
import { toolSuccess, toolWarning } from './tool_types.ts';

export interface SearchCodexToolData {
	results: RecallResultItem[];
}

export type SearchCodexToolResult = ToolResult<SearchCodexToolData>;

export function searchCodexToolHandler(
	db: CodexDb,
	input: {
		query: string;
		limit?: number;
		minScore?: number;
		category?: string;
		source?: string;
	},
): SearchCodexToolResult {
	try {
		const options: Parameters<typeof read.recall>[2] = {
			limit: input.limit,
			minScore: input.minScore,
		};
		if (input.category) options.category = input.category as typeof options.category;
		if (input.source) options.source = input.source as typeof options.source;
		const results = read.recall(db, input.query, options);
		const entities = results.slice(0, 5).map((r) => toBeliefIdRef(r.id, r.claim));
		const next =
			results.length > 0
				? results.slice(0, 3).map((r) => inspectItemNext(r.id, r.claim))
				: [
						reviewViewNext(
							'flags',
							'No recall results — try reviewing flags for beliefs needing attention.',
						),
					];
		const warnings =
			results.length === 0
				? [toolWarning('empty_result', 'No beliefs matched the query.')]
				: undefined;
		return toolSuccess(
			`Found ${results.length} belief${results.length === 1 ? '' : 's'}.`,
			{ results },
			{
				entities,
				next,
				warnings,
			},
		);
	} catch (error) {
		return translateToolError(error, { summary: 'Could not search the codex.' });
	}
}

export const searchCodexTool = defineCodexTool<
	Parameters<typeof searchCodexToolHandler>[1],
	SearchCodexToolData
>({
	name: searchCodexToolName,
	description:
		'Search active beliefs by natural language query. Returns ranked matches with recall scores and transparency metadata.',
	whenToUse:
		'Use this to find beliefs about a topic before acting on them. Always search before creating a new belief to avoid duplicates.',
	whenNotToUse:
		'Do not use this for browsing all beliefs — use review_codex with the status or flags view instead.',
	sideEffects: 'none',
	readOnly: true,
	supportsClarification: false,
	targetKinds: ['belief'],
	inputDescriptions: {
		query: 'Free-form natural language query describing what to recall.',
		limit: 'Maximum number of results. Defaults to 20.',
		minScore: 'Minimum recall score threshold. Defaults to 0.1.',
		category: 'Optional filter: preference, fact, procedure, capability, or custom.',
		source: 'Optional filter: explicit, observed, distilled, or inferred.',
	},
	outputDescription:
		'Ranked active belief matches with recall scores, score parts breakdown, certainty, freshness, and strength tier.',
	inputSchema: objectSchema(
		{
			query: stringSchema('Free-form natural language query.'),
			limit: integerSchema('Maximum number of results.'),
			minScore: numberSchema('Minimum recall score threshold.'),
			category: enumSchema(
				['preference', 'fact', 'procedure', 'capability', 'custom'],
				'Optional category filter.',
			),
			source: enumSchema(
				['explicit', 'observed', 'distilled', 'inferred'],
				'Optional source filter.',
			),
		},
		['query'],
		'Search active beliefs by query.',
	),
	handler: searchCodexToolHandler,
});
