import { codexSurfaceTools } from './surface/codex_surface_tools.ts';
import { runToolCli } from './surfaces/cli.ts';
import { codexVersion } from './version.ts';

process.exitCode = await runToolCli(process.argv.slice(2), {
	bin: 'ghostpaw-codex',
	version: codexVersion,
	description: 'Local belief and memory engine',
	tools: codexSurfaceTools,
	openContext: async (options) => {
		const { openCodexDb } = await import('./surface/open_codex_db.ts');
		const { resolveCodexDbPath } = await import('./surface/resolve_codex_db_path.ts');
		return openCodexDb(resolveCodexDbPath(options.db === undefined ? {} : { flag: options.db }));
	},
	closeContext: (db) => db.close(),
	commands: {
		mcp: async (options) => {
			const { serveCodexMcp } = await import('./mcp.ts');
			await serveCodexMcp(options.db === undefined ? {} : { dbPath: options.db });
		},
		skill: async () => {
			const { renderSkillMarkdown } = await import('./surfaces/skill_markdown.ts');
			const { codexSkillSpec } = await import('./surface/codex_skill_spec.ts');
			return renderSkillMarkdown(codexSkillSpec);
		},
	},
});
