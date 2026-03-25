import type { BeliefDetailRecord, BeliefRecord } from '../beliefs/types.ts';
import type { CodexDb } from '../database.ts';
import * as read from '../read.ts';

import { translateToolError } from './tool_errors.ts';
import { defineCodexTool, integerSchema, objectSchema } from './tool_metadata.ts';
import { inspectCodexItemToolName } from './tool_names.ts';
import { dismissNext, inspectItemNext, reviseNext } from './tool_next.ts';
import { toBeliefIdRef, toBeliefRef } from './tool_ref.ts';
import type { ToolNextStepHint, ToolResult } from './tool_types.ts';
import { toolFailure, toolSuccess } from './tool_types.ts';

export interface InspectCodexItemToolData {
	detail: BeliefDetailRecord;
	lineage: BeliefRecord[];
}

export type InspectCodexItemToolResult = ToolResult<InspectCodexItemToolData>;

export function inspectCodexItemToolHandler(
	db: CodexDb,
	input: { beliefId: number },
): InspectCodexItemToolResult {
	try {
		const detail = read.getBeliefDetail(db, input.beliefId);
		if (detail === null) {
			return toolFailure(
				'domain',
				'not_found',
				'Belief not found.',
				`Belief ${input.beliefId} does not exist.`,
			);
		}
		const lineage = read.getBeliefLineage(db, input.beliefId);
		const entities = [toBeliefIdRef(detail.id, detail.claim)];
		const next: ToolNextStepHint[] = [];
		if (detail.isActive) {
			next.push(reviseNext('confirm', detail.id, `Confirm "${detail.claim}" if it still holds.`));
			next.push(
				reviseNext(
					'correct',
					detail.id,
					`Correct "${detail.claim}" if the understanding has changed.`,
				),
			);
		}
		for (const prox of detail.proximity.slice(0, 2)) {
			next.push(inspectItemNext(prox.id, prox.claim));
			next.push(dismissNext(detail.id, prox.id));
		}
		for (const entry of lineage.filter((e) => e.id !== detail.id).slice(0, 2)) {
			entities.push(toBeliefRef(entry));
		}
		return toolSuccess(
			detail.isActive
				? `Belief "${detail.claim}" — certainty ${detail.certainty}, ${detail.strength} strength, ${detail.proximity.length} nearby.`
				: `Belief "${detail.claim}" is superseded.`,
			{ detail, lineage },
			{ entities, next },
		);
	} catch (error) {
		return translateToolError(error, { summary: 'Could not inspect the belief.' });
	}
}

export const inspectCodexItemTool = defineCodexTool<
	Parameters<typeof inspectCodexItemToolHandler>[1],
	InspectCodexItemToolData
>({
	name: inspectCodexItemToolName,
	description:
		'Inspect one belief in full detail: certainty, freshness, strength, source, category, lineage chain, proximity to similar beliefs, and version diff when applicable.',
	whenToUse:
		'Use this after finding a belief through search_codex or review_codex to understand it deeply before deciding whether to confirm, correct, or forget it.',
	whenNotToUse:
		'Do not use this for bulk browsing — use review_codex for lists. Do not call this without a specific belief id.',
	sideEffects: 'none',
	readOnly: true,
	supportsClarification: false,
	targetKinds: ['belief'],
	inputDescriptions: {
		beliefId: 'The numeric id of the belief to inspect.',
	},
	outputDescription:
		'Full belief detail record with derived state, lineage chain with all predecessors and successors, proximity matches with similarity scores, and version diff for revisions.',
	inputSchema: objectSchema(
		{ beliefId: integerSchema('Belief identifier.') },
		['beliefId'],
		'Inspect one belief in detail.',
	),
	handler: inspectCodexItemToolHandler,
});
