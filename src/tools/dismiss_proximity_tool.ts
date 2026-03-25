import type { CodexDb } from '../database.ts';
import * as write from '../write.ts';

import { defineCodexTool, integerSchema, objectSchema } from './tool_metadata.ts';
import { dismissProximityToolName } from './tool_names.ts';
import { toolSuccess } from './tool_types.ts';

export const dismissProximityToolHandler = (
	db: CodexDb,
	input: { beliefA: number; beliefB: number },
) => {
	const dismissal = write.dismissProximityPair(db, input.beliefA, input.beliefB);
	return toolSuccess(
		'Dismissed a belief proximity pair.',
		{ dismissal },
		{ entities: [{ kind: 'dismissal', id: dismissal.beliefA }] },
	);
};

export const dismissProximityTool = defineCodexTool({
	name: dismissProximityToolName,
	description: 'Suppress a misleading proximity pair for a while.',
	inputSchema: objectSchema(
		{ beliefA: integerSchema('First belief id.'), beliefB: integerSchema('Second belief id.') },
		['beliefA', 'beliefB'],
	),
	outputDescription: 'Dismissal backoff state for the pair.',
	sideEffects: 'write',
	handler: dismissProximityToolHandler,
});
