import type { CodexDb } from '../database.ts';
import type { McpServerOptions } from '../surfaces/mcp_server.ts';
import { codexVersion } from '../version.ts';
import { codexMcpInstructions } from './codex_mcp_instructions.ts';
import { codexSurfaceTools } from './codex_surface_tools.ts';

export function codexMcpOptions(
	context: () => CodexDb | Promise<CodexDb>,
): McpServerOptions<CodexDb> {
	return {
		name: 'ghostpaw-codex',
		version: codexVersion,
		title: 'Codex',
		instructions: codexMcpInstructions,
		tools: codexSurfaceTools,
		context,
		annotations: (tool) => ({
			readOnlyHint: tool.readOnly ?? false,
			destructiveHint: tool.name === 'retire_belief',
			idempotentHint: tool.readOnly ?? false,
			openWorldHint: false,
		}),
	};
}
