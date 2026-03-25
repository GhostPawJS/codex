import { BELIEF_CATEGORIES, BELIEF_SOURCES } from '../beliefs/types.ts';
import type { CodexDb } from '../database.ts';
import * as write from '../write.ts';
import { defineCodexTool, enumSchema, objectSchema, stringSchema } from './tool_metadata.ts';
import { rememberBeliefToolName } from './tool_names.ts';
import { toolSuccess } from './tool_types.ts';

export const rememberBeliefToolHandler = (
	db: CodexDb,
	input: {
		claim: string;
		source: (typeof BELIEF_SOURCES)[number];
		category: (typeof BELIEF_CATEGORIES)[number];
		provenance?: string;
	},
) => {
	const result = write.remember(db, input);
	const nearbyCount = result.proximity.length;
	const message =
		nearbyCount > 0
			? `Captured a new belief. ${nearbyCount} nearby belief${nearbyCount === 1 ? '' : 's'} found.`
			: 'Captured a new belief.';
	return toolSuccess(
		message,
		{ belief: result, proximity: result.proximity },
		{ entities: [{ kind: 'belief', id: result.id, title: result.claim }] },
	);
};

export const rememberBeliefTool = defineCodexTool({
	name: rememberBeliefToolName,
	description: 'Create a new belief from a claim and source metadata.',
	inputSchema: objectSchema(
		{
			claim: stringSchema('Belief claim.'),
			source: enumSchema(BELIEF_SOURCES, 'Belief source.'),
			category: enumSchema(BELIEF_CATEGORIES, 'Belief category.'),
			provenance: stringSchema('Optional provenance string.'),
		},
		['claim', 'source', 'category'],
	),
	outputDescription: 'The created belief record.',
	sideEffects: 'write',
	handler: rememberBeliefToolHandler,
});
