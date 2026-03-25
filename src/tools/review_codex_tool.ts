import type { CodexDb } from '../database.ts';
import * as read from '../read.ts';

import { defineCodexTool, enumSchema, objectSchema } from './tool_metadata.ts';
import { reviewCodexToolName } from './tool_names.ts';
import { type ToolResult, toolSuccess } from './tool_types.ts';

type ReviewCodexView = 'flags' | 'status' | 'log' | 'trends';

type ReviewCodexPayload =
	| { view: 'flags'; data: ReturnType<typeof read.listFlags> }
	| { view: 'log'; data: ReturnType<typeof read.listLog> }
	| { view: 'status'; data: ReturnType<typeof read.getStatus> }
	| { view: 'trends'; data: ReturnType<typeof read.getTrends> };

export const reviewCodexToolHandler = (
	db: CodexDb,
	input: { view: ReviewCodexView },
): ToolResult<ReviewCodexPayload> => {
	const view = input.view;
	if (view === 'flags')
		return toolSuccess('Loaded codex flags.', { view, data: read.listFlags(db) });
	if (view === 'log')
		return toolSuccess('Loaded codex activity log.', { view, data: read.listLog(db) });
	if (view === 'trends')
		return toolSuccess('Loaded codex trends.', { view, data: read.getTrends(db) });
	return toolSuccess('Loaded codex status.', { view, data: read.getStatus(db) });
};

export const reviewCodexTool = defineCodexTool({
	name: reviewCodexToolName,
	description: 'Load codex review surfaces such as flags, status, log, or trends.',
	inputSchema: objectSchema(
		{
			view: enumSchema(['flags', 'status', 'log', 'trends'], 'Which codex review surface to load.'),
		},
		['view'],
	),
	outputDescription: 'One codex review surface payload.',
	sideEffects: 'read',
	handler: reviewCodexToolHandler,
});
