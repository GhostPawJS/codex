const args = process.argv.slice(2);
let dbPath: string | undefined;
for (let i = 0; i < args.length; i++) {
	if (args[i] !== '--db' || !args[i + 1])
		throw new Error('Usage: ghostpaw-codex-mcp [--db <path>]');
	dbPath = args[++i];
}
const { serveCodexMcp } = await import('./surface/serve_codex_mcp.ts');
await serveCodexMcp(dbPath === undefined ? {} : { dbPath });
export {};
