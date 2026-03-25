import type { CodexDb } from '../database.ts';
import type { DismissalRecord } from '../dismissals/types.ts';
import * as write from '../write.ts';

import { translateToolError } from './tool_errors.ts';
import { defineCodexTool, integerSchema, objectSchema } from './tool_metadata.ts';
import { dismissProximityToolName } from './tool_names.ts';
import { reviewViewNext } from './tool_next.ts';
import { toDismissalRef } from './tool_ref.ts';
import type { ToolResult } from './tool_types.ts';
import { toolSuccess } from './tool_types.ts';

export interface DismissProximityToolData {
	dismissal: DismissalRecord;
}

export type DismissProximityToolResult = ToolResult<DismissProximityToolData>;

export function dismissProximityToolHandler(
	db: CodexDb,
	input: { beliefA: number; beliefB: number },
): DismissProximityToolResult {
	try {
		const dismissal = write.dismissProximityPair(db, input.beliefA, input.beliefB);
		return toolSuccess(
			`Dismissed proximity between beliefs ${dismissal.beliefA} and ${dismissal.beliefB} (count: ${dismissal.dismissCount}).`,
			{ dismissal },
			{
				entities: [toDismissalRef(dismissal)],
				next: [reviewViewNext('flags', 'Continue processing flagged beliefs.')],
			},
		);
	} catch (error) {
		return translateToolError(error, { summary: 'Could not dismiss the proximity pair.' });
	}
}

export const dismissProximityTool = defineCodexTool<
	Parameters<typeof dismissProximityToolHandler>[1],
	DismissProximityToolData
>({
	name: dismissProximityToolName,
	description:
		'Record that two beliefs are not meaningfully related despite proximity detection. Uses exponential backoff — the pair will resurface less frequently with each dismissal.',
	whenToUse:
		'Use this after inspecting two proximate beliefs and determining they are not duplicates or in conflict. The dismissal suppresses the pair in future proximity results.',
	whenNotToUse:
		'Do not use this if the beliefs are genuinely related — instead use revise_belief to merge, correct, or forget one of them.',
	sideEffects: 'writes_state',
	readOnly: false,
	supportsClarification: false,
	targetKinds: ['dismissal'],
	inputDescriptions: {
		beliefA: 'First belief id in the pair.',
		beliefB: 'Second belief id in the pair. Order does not matter — the pair is canonicalized.',
	},
	outputDescription:
		'The dismissal record with current dismiss count and resurface-after timestamp showing when the pair will reappear in proximity results.',
	inputSchema: objectSchema(
		{
			beliefA: integerSchema('First belief id.'),
			beliefB: integerSchema('Second belief id.'),
		},
		['beliefA', 'beliefB'],
		'Dismiss a misleading proximity pair.',
	),
	handler: dismissProximityToolHandler,
});
