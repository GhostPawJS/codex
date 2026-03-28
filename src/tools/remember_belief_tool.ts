import { BELIEF_CATEGORIES, BELIEF_SOURCES, type RememberResult } from '../beliefs/types.ts';
import type { CodexDb } from '../database.ts';
import * as write from '../write.ts';

import { translateToolError } from './tool_errors.ts';
import {
	defineCodexTool,
	enumSchema,
	numberSchema,
	objectSchema,
	stringSchema,
} from './tool_metadata.ts';
import { rememberBeliefToolName } from './tool_names.ts';
import { dismissNext, inspectItemNext, searchNext } from './tool_next.ts';
import { toBeliefRef } from './tool_ref.ts';
import type { ToolNextStepHint, ToolResult } from './tool_types.ts';
import { toolSuccess, toolWarning } from './tool_types.ts';

export interface RememberBeliefToolData {
	belief: RememberResult;
}

export type RememberBeliefToolResult = ToolResult<RememberBeliefToolData>;

export function rememberBeliefToolHandler(
	db: CodexDb,
	input: {
		claim: string;
		source: (typeof BELIEF_SOURCES)[number];
		category: (typeof BELIEF_CATEGORIES)[number];
		certainty?: number;
		provenance?: string;
	},
): RememberBeliefToolResult {
	try {
		const result = write.remember(db, input);
		const entities = [toBeliefRef(result)];
		const next: ToolNextStepHint[] = [inspectItemNext(result.id, result.claim)];
		const warnings = [];
		if (result.proximity.length > 0) {
			warnings.push(
				toolWarning(
					'partial_match',
					`${result.proximity.length} nearby belief${result.proximity.length === 1 ? '' : 's'} detected — review for possible duplicates.`,
				),
			);
			for (const prox of result.proximity.slice(0, 3)) {
				next.push(inspectItemNext(prox.id, prox.claim));
				next.push(dismissNext(result.id, prox.id));
			}
		}
		next.push(searchNext(result.claim, 'Search for related beliefs to check for overlap.'));
		return toolSuccess(
			result.proximity.length > 0
				? `Captured belief "${result.claim}". ${result.proximity.length} nearby belief${result.proximity.length === 1 ? '' : 's'} found — check for duplicates.`
				: `Captured belief "${result.claim}".`,
			{ belief: result },
			{
				entities,
				next,
				warnings: warnings.length > 0 ? warnings : undefined,
			},
		);
	} catch (error) {
		return translateToolError(error, { summary: 'Could not capture the belief.' });
	}
}

export const rememberBeliefTool = defineCodexTool<
	Parameters<typeof rememberBeliefToolHandler>[1],
	RememberBeliefToolData
>({
	name: rememberBeliefToolName,
	description:
		'Create a new belief from a claim, source, and category. Automatically detects nearby beliefs for duplicate awareness.',
	whenToUse:
		'Use this when a new proposition should enter the codex. Always search first to check whether the belief already exists — prefer confirming or correcting an existing belief over creating a duplicate.',
	whenNotToUse:
		'Do not use this to update an existing belief. Use revise_belief with the correct, confirm, or merge action instead.',
	sideEffects: 'writes_state',
	readOnly: false,
	supportsClarification: false,
	targetKinds: ['belief'],
	inputDescriptions: {
		claim:
			'The proposition being asserted. One claim per belief — split compound statements. When storing beliefs about a person whose name is known, use their actual name as the claim subject rather than generic labels like "User" or "The user" so that name-based recall works in future sessions.',
		source:
			'Where the belief came from: explicit (stated), observed (behavior), distilled (extracted), or inferred (concluded).',
		category: 'What kind of claim: preference, fact, procedure, capability, or custom.',
		certainty: 'Optional initial certainty 0–1. Defaults to source-weighted value.',
		provenance: 'Optional origin reference (session id, URL, context).',
	},
	outputDescription:
		'The created belief record with derived state, plus proximity matches showing nearby existing beliefs that may overlap.',
	inputSchema: objectSchema(
		{
			claim: stringSchema('The proposition being asserted.'),
			source: enumSchema([...BELIEF_SOURCES], 'Where the belief came from.'),
			category: enumSchema([...BELIEF_CATEGORIES], 'What kind of claim.'),
			certainty: numberSchema('Optional initial certainty 0–1.'),
			provenance: stringSchema('Optional origin reference.'),
		},
		['claim', 'source', 'category'],
		'Create a new belief.',
	),
	handler: rememberBeliefToolHandler,
});
