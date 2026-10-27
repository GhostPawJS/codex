import type { CodexDb } from '../database.ts';
import type { ToolCliOptions } from '../surfaces/cli.ts';
import { codexVersion } from '../version.ts';
import { codexSurfaceTools } from './codex_surface_tools.ts';

export const codexCliOptions: ToolCliOptions<CodexDb> = {
	bin: 'ghostpaw-codex',
	version: codexVersion,
	description: 'Local belief and memory engine',
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
		skill: async () => {
			const { renderSkillMarkdown } = await import('../surfaces/skill_markdown.ts');
			const { codexSkillSpec } = await import('./codex_skill_spec.ts');
			return renderSkillMarkdown(codexSkillSpec);
		},
	},
};
