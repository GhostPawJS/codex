import type { CodexDb } from '../database.ts';
import { createMcpServer } from '../surfaces/mcp_server.ts';
import { serveMcpStdio } from '../surfaces/mcp_stdio.ts';
import { codexMcpOptions } from './codex_mcp_options.ts';
import { openCodexDb } from './open_codex_db.ts';
import { resolveCodexDbPath } from './resolve_codex_db_path.ts';

export async function serveCodexMcp(
	options: { db?: CodexDb; dbPath?: string } = {},
): Promise<void> {
	let owned: CodexDb | undefined;
	const server = createMcpServer(
		codexMcpOptions(async () => {
			if (options.db) return options.db;
			owned = await openCodexDb(
				resolveCodexDbPath(options.dbPath === undefined ? {} : { flag: options.dbPath }),
			);
			return owned;
		}),
	);
	try {
		await serveMcpStdio(server);
	} finally {
		owned?.close();
	}
}
