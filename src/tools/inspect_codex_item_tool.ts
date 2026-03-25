import type { CodexDb } from '../database.ts';
import * as read from '../read.ts';

import { defineCodexTool, integerSchema, objectSchema } from './tool_metadata.ts';
import { inspectCodexItemToolName } from './tool_names.ts';
import { toolFailure, toolSuccess } from './tool_types.ts';

export const inspectCodexItemToolHandler = (db: CodexDb, input: { beliefId: number }) => {
	const detail = read.getBeliefDetail(db, input.beliefId);
	if (detail === null) {
		return toolFailure(
			'domain',
			'not_found',
			'Belief not found.',
			`Belief ${input.beliefId} does not exist.`,
		);
	}
	return toolSuccess(
		'Loaded belief detail.',
		{ detail, lineage: read.getBeliefLineage(db, input.beliefId) },
		{ entities: [{ kind: 'belief', id: input.beliefId, title: detail.claim }] },
	);
};

export const inspectCodexItemTool = defineCodexTool({
	name: inspectCodexItemToolName,
	description: 'Inspect one belief in detail, including lineage.',
	inputSchema: objectSchema({ beliefId: integerSchema('Belief identifier.') }, ['beliefId']),
	outputDescription: 'One belief detail payload with lineage.',
	sideEffects: 'read',
	handler: inspectCodexItemToolHandler,
});
