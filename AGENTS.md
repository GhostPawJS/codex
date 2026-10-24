# @ghostpaw/codex

Local belief and memory engine for Node.js on SQLite, with a structured tool
facade, an MCP server, a CLI and an Agent Skill generated from the same tools.

## Use

Install with `npm install @ghostpaw/codex` in a consuming project.

```ts
import { DatabaseSync } from 'node:sqlite';
import { initCodexTables, read, write } from '@ghostpaw/codex';
const db = new DatabaseSync('codex.db');
db.exec('PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000');
initCodexTables(db);
const { id } = write.remember(db, { claim: 'Deploys go out on Tuesdays.', source: 'explicit', category: 'procedure' });
read.recall(db, 'when do we deploy');
```

The library caller owns the database connection. The MCP server and CLI open
`--db <path>`, `GHOSTPAW_CODEX_DB` or `~/.ghostpaw/codex.db` (WAL,
busy_timeout=5000). MCP: `npx -y @ghostpaw/codex mcp`.

Tools live in `src/tools/` and are exported through `tools`
(`tools.codexTools`, synchronous `handler(db, input)`). Results have
`{ ok, outcome, summary, entities, next?, data | error }`.

## Layout

- `src/beliefs/`, `src/dismissals/`, `src/lib/`: domain model and SQLite storage.
- `src/read.ts`, `src/write.ts`: public read and write namespaces.
- `src/tools/`, `src/skills/`, `src/soul.ts`: tool registry, workflow skills, prompt foundation.
- `src/surfaces/`: library-agnostic MCP server, stdio transport, CLI, SKILL.md and manifest renderers.
- `src/surface/`: codex bindings for those surfaces; `src/mcp.ts`, `src/cli.ts`, `src/mcp_server_bin.ts` are entries.
- `scripts/surfaces/`: generator for `SKILL.md`, `skills/codex/`, `plugin.json`, `mcp.json`, `.claude-plugin/`, `server.json`, `mcpb/manifest.json`. Never edit those outputs by hand; run `npm run surfaces`.
- `scripts/guard/`: size, API, consumer, startup and ratchet guards; `scripts/bench/`: benchmarks.
- `docs/`: detailed usage documentation.

## Contribute

Use Node 24. `npm run check` is the single gate: types, lint, tests, build,
zero runtime dependencies (`npm run check:deps`), generated-surface drift,
gzip size budgets (`budgets.json`), the public API snapshot
(`api-surface.json`), a packed-tarball consumer install, cold-start budgets
and the ratchet.
Use node:test and node:assert, with *.test.ts next to source.
Assert real behavior; preserve existing assertions and coverage.

The package has zero runtime dependencies. Do not add runtime dependencies.
Keep exported APIs, tool names and fields, CLI flags, MCP behavior and
database schemas compatible. Make additive changes only.
Budgets and the API snapshot may only grow with `[budget-increase-approved]`
or `[api-change-approved]` in the commit message; guard, workflow and lint
config changes need `[guardrails-change-approved]`.
Record changes under Unreleased in CHANGELOG.md in neutral maintainer prose.

Release with `npm run release:patch` or `npm run release:minor`; the tag
triggers npm trusted publishing with provenance, the GitHub release with
`server.mcpb`, and the MCP Registry update.
Maintainers run releases after review; leave task changes uncommitted.
