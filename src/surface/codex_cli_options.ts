import { resolve } from 'node:path';
import type { CodexDb } from '../database.ts';
import type { ToolCliOptions } from '../surfaces/cli.ts';
import { codexVersion } from '../version.ts';
import { codexSurfaceTools } from './codex_surface_tools.ts';
import { renderCodexPlainResult } from './render_codex_plain_result.ts';
import { resolveCodexDbPath } from './resolve_codex_db_path.ts';

export const codexCliOptions: ToolCliOptions<CodexDb> = {
	bin: 'ghostpaw-codex',
	version: codexVersion,
	description: 'Local belief and memory engine',
	formatResult: renderCodexPlainResult,
	describeDb: (options) =>
		`Database: ${resolve(resolveCodexDbPath(options.db === undefined ? {} : { flag: options.db }))}\nUse --db <path> or GHOSTPAW_CODEX_DB to override the default ~/.ghostpaw/codex.db.`,
	tools: codexSurfaceTools,
	openContext: async (options) => {
		const { openCodexDb } = await import('./open_codex_db.ts');
		const { resolveCodexDbPath } = await import('./resolve_codex_db_path.ts');
		return openCodexDb(resolveCodexDbPath(options.db === undefined ? {} : { flag: options.db }));
	},
	closeContext: (db) => db.close(),
	commands: {
		mcp: async (options) => {
			const { serveCodexMcp } = await import('./serve_codex_mcp.ts');
			await serveCodexMcp(options.db === undefined ? {} : { dbPath: options.db });
		},
		skill: async (args) => {
			const { renderCodexSkillCommand } = await import('./render_codex_skill_command.ts');
			return renderCodexSkillCommand(args);
		},
	},
};
