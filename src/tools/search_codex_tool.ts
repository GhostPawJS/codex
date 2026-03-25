import type { CodexDb } from '../database.ts';
import * as read from '../read.ts';

import { defineCodexTool, integerSchema, objectSchema, stringSchema } from './tool_metadata.ts';
import { searchCodexToolName } from './tool_names.ts';
import { toolFailure, toolSuccess } from './tool_types.ts';

export const searchCodexToolHandler = (db: CodexDb, input: { query: string; limit?: number }) => {
	if (input.query.trim().length === 0) {
		return toolFailure(
			'protocol',
			'invalid_input',
			'Query required.',
			'The query must not be empty.',
		);
	}
	const results = read.recall(db, input.query, { limit: input.limit, minScore: 0 });
	return toolSuccess(`Found ${results.length} belief matches.`, { results });
};

export const searchCodexTool = defineCodexTool({
	name: searchCodexToolName,
	description: 'Search active beliefs through codex recall.',
	inputSchema: objectSchema(
		{
			query: stringSchema('Free-form recall query.'),
			limit: integerSchema('Optional maximum result count.'),
		},
		['query'],
	),
	outputDescription: 'Ranked active belief matches with score parts.',
	sideEffects: 'read',
	handler: searchCodexToolHandler,
});
