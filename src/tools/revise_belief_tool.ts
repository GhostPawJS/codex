import { BELIEF_CATEGORIES, BELIEF_SOURCES } from '../beliefs/types.ts';
import type { CodexDb } from '../database.ts';
import * as write from '../write.ts';

import { translateToolError } from './tool_errors.ts';
import {
	arraySchema,
	defineCodexTool,
	enumSchema,
	integerSchema,
	numberSchema,
	objectSchema,
	stringSchema,
} from './tool_metadata.ts';
import { reviseBeliefToolName } from './tool_names.ts';
import { dismissNext, inspectItemNext, reviewViewNext } from './tool_next.ts';
import { toBeliefIdRef, toBeliefRef } from './tool_ref.ts';
import type { ToolEntityRef, ToolNextStepHint, ToolResult } from './tool_types.ts';
import { toolNeedsClarification, toolSuccess } from './tool_types.ts';

export interface ReviseBeliefToolInput {
	action: 'confirm' | 'correct' | 'merge' | 'forget' | 'defer';
	beliefId?: number;
	beliefIds?: number[];
	claim?: string;
	successorId?: number;
	deferredUntil?: number;
	source?: (typeof BELIEF_SOURCES)[number];
	category?: (typeof BELIEF_CATEGORIES)[number];
	certainty?: number;
}

export type ReviseBeliefToolResult = ToolResult<Record<string, unknown>>;

function handleConfirm(db: CodexDb, input: ReviseBeliefToolInput): ReviseBeliefToolResult {
	if (input.beliefId === undefined) {
		return toolNeedsClarification('missing_required_choice', 'Which belief should be confirmed?', [
			'beliefId',
		]);
	}
	const belief = write.confirmBelief(db, input.beliefId);
	return toolSuccess(
		`Confirmed "${belief.claim}" — certainty now ${belief.certainty.toFixed(2)}, evidence ${belief.evidence}.`,
		{ belief },
		{
			entities: [toBeliefRef(belief)],
			next: [inspectItemNext(belief.id, belief.claim)],
		},
	);
}

function handleCorrect(db: CodexDb, input: ReviseBeliefToolInput): ReviseBeliefToolResult {
	if (input.beliefId === undefined || !input.claim) {
		return toolNeedsClarification(
			'missing_required_choice',
			'Correction requires the old belief id and the replacement claim.',
			[...(input.beliefId === undefined ? ['beliefId'] : []), ...(!input.claim ? ['claim'] : [])],
		);
	}
	const result = write.correctBelief(db, input.beliefId, {
		claim: input.claim,
		source: input.source,
		category: input.category,
		certainty: input.certainty,
	});
	const entities: ToolEntityRef[] = [toBeliefRef(result), toBeliefIdRef(result.supersededId)];
	const next: ToolNextStepHint[] = [inspectItemNext(result.id, result.claim)];
	for (const prox of result.proximity.slice(0, 2)) {
		next.push(inspectItemNext(prox.id, prox.claim));
		next.push(dismissNext(result.id, prox.id));
	}
	return toolSuccess(
		`Corrected belief ${result.supersededId} → ${result.id} "${result.claim}".${result.proximity.length > 0 ? ` ${result.proximity.length} nearby.` : ''}`,
		{ belief: result, supersededId: result.supersededId, proximity: result.proximity },
		{ entities, next },
	);
}

function handleMerge(db: CodexDb, input: ReviseBeliefToolInput): ReviseBeliefToolResult {
	if (!input.beliefIds || input.beliefIds.length < 2) {
		return toolNeedsClarification(
			'missing_required_choice',
			'Merge requires at least two belief ids.',
			['beliefIds'],
		);
	}
	const belief = write.mergeBeliefs(db, {
		beliefIds: input.beliefIds,
		claim: input.claim,
		successorId: input.successorId,
		source: input.source,
		category: input.category,
		certainty: input.certainty,
	});
	return toolSuccess(
		`Merged ${input.beliefIds.length} beliefs into "${belief.claim}".`,
		{ belief, mergedIds: input.beliefIds },
		{
			entities: [toBeliefRef(belief)],
			next: [inspectItemNext(belief.id, belief.claim)],
		},
	);
}

function handleForget(db: CodexDb, input: ReviseBeliefToolInput): ReviseBeliefToolResult {
	if (input.beliefId === undefined) {
		return toolNeedsClarification('missing_required_choice', 'Which belief should be forgotten?', [
			'beliefId',
		]);
	}
	const belief = write.forgetBelief(db, input.beliefId, {
		successorId: input.successorId,
	});
	return toolSuccess(
		input.successorId
			? `Forgot belief ${input.beliefId}, superseded to ${input.successorId}.`
			: `Forgot belief ${input.beliefId}.`,
		{ belief },
		{
			entities: [toBeliefIdRef(input.beliefId, belief.claim)],
			next: [reviewViewNext('flags', 'Continue reviewing flagged beliefs.')],
		},
	);
}

function handleDefer(db: CodexDb, input: ReviseBeliefToolInput): ReviseBeliefToolResult {
	if (input.beliefId === undefined || input.deferredUntil === undefined) {
		return toolNeedsClarification(
			'missing_required_choice',
			'Defer requires the belief id and a deferredUntil timestamp.',
			[
				...(input.beliefId === undefined ? ['beliefId'] : []),
				...(input.deferredUntil === undefined ? ['deferredUntil'] : []),
			],
		);
	}
	const belief = write.deferBelief(db, input.beliefId, input.deferredUntil);
	return toolSuccess(
		`Deferred belief "${belief.claim}" until ${input.deferredUntil}.`,
		{ belief },
		{
			entities: [toBeliefRef(belief)],
			next: [reviewViewNext('flags', 'Continue reviewing other flagged beliefs.')],
		},
	);
}

export function reviseBeliefToolHandler(
	db: CodexDb,
	input: ReviseBeliefToolInput,
): ReviseBeliefToolResult {
	try {
		switch (input.action) {
			case 'confirm':
				return handleConfirm(db, input);
			case 'correct':
				return handleCorrect(db, input);
			case 'merge':
				return handleMerge(db, input);
			case 'forget':
				return handleForget(db, input);
			case 'defer':
				return handleDefer(db, input);
		}
	} catch (error) {
		return translateToolError(error, { summary: `Could not ${input.action} the belief.` });
	}
}

export const reviseBeliefTool = defineCodexTool<ReviseBeliefToolInput, Record<string, unknown>>({
	name: reviseBeliefToolName,
	description:
		'Revise an existing belief: confirm it still holds, correct it with a new claim, merge multiple beliefs into one, forget it from active recall, or defer its next flag review.',
	whenToUse:
		'Use this after inspecting a belief to act on it. Choose the action that matches the situation: confirm for reinforcement, correct for changed understanding, merge for consolidation, forget for removal from active recall, defer for postponing review.',
	whenNotToUse:
		'Do not use this to create a new belief — use remember_belief. Do not use this to permanently delete a belief — use retire_belief.',
	sideEffects: 'writes_state',
	readOnly: false,
	supportsClarification: true,
	targetKinds: ['belief'],
	inputDescriptions: {
		action: 'The revision verb: confirm, correct, merge, forget, or defer.',
		beliefId: 'The belief to revise. Required for confirm, correct, forget, defer.',
		beliefIds: 'Two or more belief ids to merge. Required for merge.',
		claim: 'Replacement claim text. Required for correct, optional for merge.',
		successorId: 'Existing active belief to supersede to. Optional for merge and forget.',
		deferredUntil: 'Timestamp until which the belief is excluded from flags. Required for defer.',
		source: 'Optional replacement source for correct and merge.',
		category: 'Optional replacement category for correct and merge.',
		certainty: 'Optional certainty override for correct and merge.',
	},
	outputDescription:
		'The updated belief record. Correct also returns the superseded id and proximity matches. Merge returns the merged ids.',
	inputSchema: objectSchema(
		{
			action: enumSchema(['confirm', 'correct', 'merge', 'forget', 'defer'], 'Revision action.'),
			beliefId: integerSchema('Single belief id.'),
			beliefIds: arraySchema(integerSchema('Belief id.'), 'Belief ids for merge.'),
			claim: stringSchema('Replacement or merged claim.'),
			successorId: integerSchema('Existing active successor belief id.'),
			deferredUntil: integerSchema('Future timestamp for deferred review.'),
			source: enumSchema([...BELIEF_SOURCES], 'Optional replacement source.'),
			category: enumSchema([...BELIEF_CATEGORIES], 'Optional replacement category.'),
			certainty: numberSchema('Optional certainty override.'),
		},
		['action'],
		'Revise an existing belief.',
	),
	handler: reviseBeliefToolHandler,
});
