import type { CodexDb } from '../database.ts';
import * as write from '../write.ts';

import { translateToolError } from './tool_errors.ts';
import { defineCodexTool, integerSchema, objectSchema } from './tool_metadata.ts';
import { retireBeliefToolName } from './tool_names.ts';
import { reviewViewNext } from './tool_next.ts';
import type { ToolResult } from './tool_types.ts';
import { toolSuccess, toolWarning } from './tool_types.ts';

export interface RetireBeliefToolData {
	deletedIds: number[];
}

export type RetireBeliefToolResult = ToolResult<RetireBeliefToolData>;

export function retireBeliefToolHandler(
	db: CodexDb,
	input: { beliefId: number },
): RetireBeliefToolResult {
	try {
		const deletedIds = write.deleteBelief(db, input.beliefId);
		if (deletedIds.length === 0) {
			return toolSuccess(
				'Nothing to delete — belief does not exist.',
				{ deletedIds },
				{
					warnings: [toolWarning('empty_result', `Belief ${input.beliefId} was not found.`)],
				},
			);
		}
		return toolSuccess(
			`Permanently deleted ${deletedIds.length} belief${deletedIds.length === 1 ? '' : 's'} from lineage.`,
			{ deletedIds },
			{
				next: [reviewViewNext('status', 'Check codex status after deletion.')],
			},
		);
	} catch (error) {
		return translateToolError(error, { summary: 'Could not delete the belief.' });
	}
}

export const retireBeliefTool = defineCodexTool<
	Parameters<typeof retireBeliefToolHandler>[1],
	RetireBeliefToolData
>({
	name: retireBeliefToolName,
	description:
		'Permanently delete a belief and its entire lineage chain. No trace remains. This is for privacy and hard erasure, not normal revision.',
	whenToUse:
		'Use this only for privacy cleanup or hard erasure. The belief and all of its lineage (predecessors and successors) will be destroyed.',
	whenNotToUse:
		'Do not use this for normal belief lifecycle — use revise_belief with the forget action to preserve the audit trail.',
	sideEffects: 'writes_state',
	readOnly: false,
	supportsClarification: false,
	targetKinds: ['belief'],
	inputDescriptions: {
		beliefId: 'The belief to delete. Its entire lineage chain will be removed.',
	},
	outputDescription:
		'The list of belief ids that were deleted, including all predecessors and successors in the lineage.',
	inputSchema: objectSchema(
		{ beliefId: integerSchema('Belief id to delete.') },
		['beliefId'],
		'Permanently delete a belief and its lineage.',
	),
	handler: retireBeliefToolHandler,
});
