import type { CodexDb } from './database.ts';
import { codexMcpOptions } from './surface/codex_mcp_options.ts';
import { openCodexDb } from './surface/open_codex_db.ts';
import { resolveCodexDbPath } from './surface/resolve_codex_db_path.ts';
import { createMcpServer } from './surfaces/mcp_server.ts';

export { codexMcpInstructions } from './surface/codex_mcp_instructions.ts';
export { serveCodexMcp } from './surface/serve_codex_mcp.ts';
export type { McpServerOptions } from './surfaces/mcp_server.ts';
export {
	createMcpServer,
	MCP_LATEST_PROTOCOL_VERSION,
	MCP_SUPPORTED_PROTOCOL_VERSIONS,
} from './surfaces/mcp_server.ts';
export { serveMcpStdio } from './surfaces/mcp_stdio.ts';
export type * from './surfaces/surface_types.ts';

export function createCodexMcpServer(options: { db?: CodexDb; dbPath?: string } = {}) {
	return createMcpServer(
		codexMcpOptions(
			() =>
				options.db ??
				openCodexDb(
					resolveCodexDbPath(options.dbPath === undefined ? {} : { flag: options.dbPath }),
				),
		),
	);
}
