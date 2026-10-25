// CLI wiring for the single executable (SEA) build. Same as src/cli.ts, but
// without top-level await so it bundles to CommonJS, which lets Node embed a
// V8 code cache or a startup snapshot in the binary.
import { codexSurfaceTools } from '../../src/surface/codex_surface_tools.ts';
import { runToolCli } from '../../src/surfaces/cli.ts';
import { codexVersion } from '../../src/version.ts';

export const run = (): Promise<void> =>
	runToolCli(process.argv.slice(2), {
		bin: 'ghostpaw-codex',
		version: codexVersion,
		description: 'Local belief and memory engine',
		tools: codexSurfaceTools,
		openContext: async (options) => {
			const { openCodexDb } = await import('../../src/surface/open_codex_db.ts');
			const { resolveCodexDbPath } = await import('../../src/surface/resolve_codex_db_path.ts');
			return openCodexDb(resolveCodexDbPath(options.db === undefined ? {} : { flag: options.db }));
		},
		closeContext: (db) => db.close(),
		commands: {
			mcp: async (options) => {
				const { serveCodexMcp } = await import('../../src/surface/serve_codex_mcp.ts');
				await serveCodexMcp(options.db === undefined ? {} : { dbPath: options.db });
			},
			skill: async () => {
				const { renderSkillMarkdown } = await import('../../src/surfaces/skill_markdown.ts');
				const { codexSkillSpec } = await import('../../src/surface/codex_skill_spec.ts');
				return renderSkillMarkdown(codexSkillSpec);
			},
		},
	}).then(
		(code) => {
			process.exitCode = code;
		},
		(error: unknown) => {
			process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
			process.exitCode = 1;
		},
	);
