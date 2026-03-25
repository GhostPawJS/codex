import type { CodexDb } from '../database.ts';
import * as write from '../write.ts';

import { defineCodexTool, integerSchema, objectSchema } from './tool_metadata.ts';
import { retireBeliefToolName } from './tool_names.ts';
import { toolSuccess } from './tool_types.ts';

export const retireBeliefToolHandler = (db: CodexDb, input: { beliefId: number }) => {
	const deletedIds = write.deleteBelief(db, input.beliefId);
	return toolSuccess(`Deleted ${deletedIds.length} belief lineage rows.`, { deletedIds });
};

export const retireBeliefTool = defineCodexTool({
	name: retireBeliefToolName,
	description: 'Delete a belief and its lineage chain permanently.',
	inputSchema: objectSchema({ beliefId: integerSchema('Belief id to delete.') }, ['beliefId']),
	outputDescription: 'Ids deleted from the codex lineage component.',
	sideEffects: 'write',
	handler: retireBeliefToolHandler,
});
