import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { addQueryAlias } from '../beliefs/add_query_alias.ts';
import { listQueryAliases } from '../beliefs/list_query_aliases.ts';
import { normalizeQueryAlias } from '../beliefs/normalize_query_alias.ts';
import { removeQueryAlias } from '../beliefs/remove_query_alias.ts';
import type { CodexDb } from '../database.ts';
import { CodexNotFoundError } from '../errors.ts';
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
		if (options.db && options.db !== ':memory:' && !existsSync(dirname(options.db)))
			throw new CodexNotFoundError(`Database directory does not exist: ${dirname(options.db)}`);
		const { openCodexDb } = await import('./open_codex_db.ts');
		const { resolveCodexDbPath } = await import('./resolve_codex_db_path.ts');
		return openCodexDb(resolveCodexDbPath(options.db === undefined ? {} : { flag: options.db }));
	},
	closeContext: (db) => db.close(),
	commands: {
		alias: (db, args) => {
			if (args[0] === 'list') {
				const aliases = listQueryAliases(db);
				return {
					text: aliases.map(({ term, alias }) => `${term}  ${alias}`).join('\n') || 'No aliases.',
					data: { ok: true, data: aliases },
				};
			}
			const [term, alias] = normalizeQueryAlias(args[1] ?? '', args[2] ?? '');
			if (args[0] === 'add') {
				const exists = listQueryAliases(db).some(
					(entry) => entry.term === term && entry.alias === alias,
				);
				addQueryAlias(db, term, alias);
				return {
					text: `${exists ? 'Alias exists' : 'Added alias'}: ${term} -> ${alias}`,
					data: { ok: true, term, alias },
				};
			}
			const removed = removeQueryAlias(db, term, alias);
			return {
				text: removed
					? `Removed alias: ${term} -> ${alias}`
					: `Alias not found: ${term} -> ${alias}. Use alias list to inspect configured aliases.`,
				data: { ok: removed, term, alias },
				code: removed ? 0 : 3,
			};
		},
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
