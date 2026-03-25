import { BELIEF_CATEGORIES, BELIEF_SOURCES } from '../beliefs/types.ts';
import type { CodexDb } from '../database.ts';
import * as write from '../write.ts';
import {
	arraySchema,
	defineCodexTool,
	enumSchema,
	integerSchema,
	objectSchema,
	stringSchema,
} from './tool_metadata.ts';
import { reviseBeliefToolName } from './tool_names.ts';
import { toolNeedsClarification, toolSuccess } from './tool_types.ts';

export const reviseBeliefToolHandler = (
	db: CodexDb,
	input: {
		action: 'confirm' | 'correct' | 'merge' | 'forget' | 'defer';
		beliefId?: number;
		beliefIds?: number[];
		claim?: string;
		successorId?: number;
		deferredUntil?: number;
		source?: (typeof BELIEF_SOURCES)[number];
		category?: (typeof BELIEF_CATEGORIES)[number];
	},
) => {
	if (input.action === 'confirm') {
		if (input.beliefId === undefined)
			return toolNeedsClarification('missing_required_choice', 'Belief id required for confirm.', [
				'beliefId',
			]);
		return toolSuccess('Confirmed belief.', { belief: write.confirmBelief(db, input.beliefId) });
	}
	if (input.action === 'correct') {
		if (input.beliefId === undefined || !input.claim)
			return toolNeedsClarification(
				'missing_required_choice',
				'Belief id and replacement claim required for correct.',
				['beliefId', 'claim'],
			);
		const result = write.correctBelief(db, input.beliefId, {
			claim: input.claim,
			source: input.source,
			category: input.category,
		});
		return toolSuccess('Corrected belief.', {
			belief: result,
			supersededId: result.supersededId,
			proximity: result.proximity,
		});
	}
	if (input.action === 'merge') {
		if (!input.beliefIds || input.beliefIds.length < 2)
			return toolNeedsClarification(
				'missing_required_choice',
				'At least two belief ids required for merge.',
				['beliefIds'],
			);
		return toolSuccess('Merged beliefs.', {
			belief: write.mergeBeliefs(db, {
				beliefIds: input.beliefIds,
				claim: input.claim,
				successorId: input.successorId,
				source: input.source,
				category: input.category,
			}),
		});
	}
	if (input.action === 'forget') {
		if (input.beliefId === undefined)
			return toolNeedsClarification('missing_required_choice', 'Belief id required for forget.', [
				'beliefId',
			]);
		return toolSuccess('Forgot belief.', {
			belief: write.forgetBelief(db, input.beliefId, { successorId: input.successorId }),
		});
	}
	if (input.beliefId === undefined || input.deferredUntil === undefined)
		return toolNeedsClarification(
			'missing_required_choice',
			'Belief id and deferredUntil required for defer.',
			['beliefId', 'deferredUntil'],
		);
	return toolSuccess('Deferred belief.', {
		belief: write.deferBelief(db, input.beliefId, input.deferredUntil),
	});
};

export const reviseBeliefTool = defineCodexTool({
	name: reviseBeliefToolName,
	description: 'Confirm, correct, merge, forget, or defer an existing belief.',
	inputSchema: objectSchema(
		{
			action: enumSchema(['confirm', 'correct', 'merge', 'forget', 'defer'], 'Revision action.'),
			beliefId: integerSchema('Single belief id.'),
			beliefIds: arraySchema(integerSchema('Belief id.'), 'Belief ids for merge.'),
			claim: stringSchema('Replacement or merged claim.'),
			successorId: integerSchema('Existing active successor belief id.'),
			deferredUntil: integerSchema('Future timestamp for deferred review.'),
			source: enumSchema(BELIEF_SOURCES, 'Optional replacement source.'),
			category: enumSchema(BELIEF_CATEGORIES, 'Optional replacement category.'),
		},
		['action'],
	),
	outputDescription: 'Result of the requested belief revision action.',
	sideEffects: 'write',
	handler: reviseBeliefToolHandler,
});
