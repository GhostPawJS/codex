<a href="https://codex.ghostpaw.dev/"><img src="https://raw.githubusercontent.com/GhostPawJS/codex/main/.github/social-preview.png" alt="GhostPaw codex: When one agent saves a wrong fact, every agent trusts it." width="100%"></a>

# @ghostpaw/codex

[![npm](https://img.shields.io/npm/v/@ghostpaw/codex?style=flat-square&labelColor=0a1119&color=62e6f2&label=npm)](https://www.npmjs.com/package/@ghostpaw/codex) [![CI](https://img.shields.io/github/actions/workflow/status/GhostPawJS/codex/ci.yml?branch=main&style=flat-square&labelColor=0a1119&label=CI)](https://github.com/GhostPawJS/codex/actions/workflows/ci.yml) [![site](https://img.shields.io/badge/site-codex.ghostpaw.dev-62e6f2?style=flat-square&labelColor=0a1119)](https://codex.ghostpaw.dev/) [![runtime deps](https://img.shields.io/badge/runtime_deps-0-7af0b4?style=flat-square&labelColor=0a1119)](package.json) [![MCP Registry](https://img.shields.io/badge/MCP_Registry-io.github.GhostPawJS%2Fcodex-b39dff?style=flat-square&labelColor=0a1119)](https://registry.modelcontextprotocol.io/v0.1/servers/io.github.GhostPawJS%2Fcodex/versions/latest) [![node](https://img.shields.io/badge/node-%E2%89%A524-93a5b9?style=flat-square&labelColor=0a1119)](https://nodejs.org) [![license](https://img.shields.io/npm/l/@ghostpaw/codex?style=flat-square&labelColor=0a1119&color=93a5b9)](LICENSE)

**Agent memory as beliefs with a source, a certainty and a revision history.**

```bash
npm install @ghostpaw/codex
```

Local, evidence-backed memory for AI agents. One SQLite file, zero runtime
dependencies.

Codex stores what an agent believes as claims with a source, a certainty,
evidence counts, decay and an honest revision history. Agents search before
they remember, confirm or correct instead of appending, and see which beliefs
are stale, fading or weakly evidenced. It runs as a TypeScript library, an MCP
server, a CLI and an Agent Skill, all generated from the same seven tools.

Website: [codex.ghostpaw.dev](https://codex.ghostpaw.dev/)

Requires **Node.js 24+** (uses the built-in `node:sqlite`).

## Install

The [npm package](https://www.npmjs.com/package/@ghostpaw/codex) requires Node 24+:

```sh
npm install -g @ghostpaw/codex
npx -y @ghostpaw/codex --help
```

Standalone binaries are available from [GitHub Releases](https://github.com/GhostPawJS/codex/releases)
for linux-x64, linux-arm64, darwin-arm64, darwin-x64 and windows-x64.

```sh
curl -fsSL https://raw.githubusercontent.com/GhostPawJS/codex/main/install.sh | sh
```

```powershell
irm https://raw.githubusercontent.com/GhostPawJS/codex/main/install.ps1 | iex
```

Other release installers:

```sh
mise use -g github:GhostPawJS/codex
ubi --project GhostPawJS/codex --exe ghostpaw-codex --in ~/.local/bin
eget GhostPawJS/codex
```

For [aqua](https://aquaproj.github.io/docs/reference/registry-config/), define a
`github_release` package in `aqua.yaml`:

```yaml
registries:
  - name: codex
    type: local
    path: codex-registry.yaml
packages:
  - name: GhostPawJS/codex@v0.4.0
    registry: codex
```

`codex-registry.yaml`:

```yaml
packages:
  - type: github_release
    repo_owner: GhostPawJS
    repo_name: codex
    asset: ghostpaw-codex-{{trimV .Version}}-{{.OS}}-{{.Arch}}.tar.gz
    format: tar.gz
    replacements: { amd64: x64 }
    overrides:
      - goos: windows
        asset: ghostpaw-codex-{{trimV .Version}}-windows-{{.Arch}}.zip
        format: zip
    files:
      - name: ghostpaw-codex
```

Install scripts verify SHA256SUMS. To verify a downloaded archive's
[build attestation](https://cli.github.com/manual/gh_attestation_verify):

```sh
gh attestation verify <archive> -R GhostPawJS/codex
```

Set `GHOSTPAW_VERIFY=attestation` for attestation verification in `install.sh`.
Binaries are unsigned; macOS binaries carry an ad-hoc signature. For a browser
download on macOS, remove quarantine with
`xattr -d com.apple.quarantine /path/to/ghostpaw-codex`.
Linux binaries require glibc 2.28+; use npx on Alpine.
See the [binary build workflow](.github/workflows/release-binaries.yml).

<!-- sizes -->

## 30-second quickstart

### MCP server

Every client below starts the same stdio server: `npx -y @ghostpaw/codex mcp`.
Beliefs live in `~/.ghostpaw/codex.db` unless the `GHOSTPAW_CODEX_DB`
environment variable (absolute path) or `--db <path>` says otherwise.

**Claude Code**

```bash
claude mcp add ghostpaw-codex -- npx -y @ghostpaw/codex mcp
```

or as a plugin, which also installs the skill:

```bash
/plugin marketplace add GhostPawJS/codex
/plugin install ghostpaw-codex@ghostpaw-codex
```

**Codex CLI** (`~/.codex/config.toml`)

```toml
[mcp_servers.ghostpaw-codex]
command = "npx"
args = ["-y", "@ghostpaw/codex", "mcp"]
```

**Cursor** (`.cursor/mcp.json`), **Claude Desktop** (`claude_desktop_config.json`)
or a project `.mcp.json`:

```json
{
  "mcpServers": {
    "ghostpaw-codex": {
      "command": "npx",
      "args": ["-y", "@ghostpaw/codex", "mcp"]
    }
  }
}
```

Claude Desktop users can also install `server.mcpb` from the
[latest GitHub release](https://github.com/GhostPawJS/codex/releases/latest).
A Dockerfile is included for container hosts:
`docker build -t ghostpaw-codex . && docker run -i --rm -v codex:/data ghostpaw-codex`.

The server speaks MCP 2026-07-28 (stateless, `server/discover`) and the
initialize-based revisions 2025-11-25, 2025-06-18, 2025-03-26 and 2024-11-05.

## CLI

```text
ghostpaw-codex search <query> [--limit N --min-score N --category C --source S]
ghostpaw-codex review <flags|status|log|trends> [--limit N --now N]
ghostpaw-codex belief add <claim> --source S --category C [--certainty N --provenance P]
ghostpaw-codex belief show <beliefId>
ghostpaw-codex belief retire <beliefId>
ghostpaw-codex belief confirm|correct|forget|defer <beliefId> [flags]
ghostpaw-codex belief merge <beliefIds...> [flags]
ghostpaw-codex proximity dismiss <beliefA> <beliefB>
ghostpaw-codex mcp|skill|tools|describe|call|completions|version|help
```

Global flags can appear anywhere: `--db <path>`, `--json`, `--quiet`,
`--compact`, `--help`/`-h`, `--version`/`-V`/`-v`, `--no-color`.
`NO_COLOR` is accepted; output uses no terminal colors.
Noun-verb commands print the full tool result as JSON with `--json` or when
stdout is piped. Terminal output shows the summary and payload.
`--quiet` suppresses stdout. `--compact` removes JSON indentation.

Use `help belief`, `belief --help` or `belief correct --help` for schema-derived
help. Correction takes `--claim`; defer takes `--deferred-until` (timestamp).
Array flags repeat, kebab-case flags map to schema properties, and `@path`
reads a value from a file. `--` ends flags. A positional `-`, or piped stdin
with no arguments, reads a JSON object; explicit flags override its fields.
Database selection uses `--db`, `GHOSTPAW_CODEX_DB`, then `~/.ghostpaw/codex.db`.

| Exit | Noun-verb result |
|---|---|
| 0 | Success, including no_op |
| 1 | Tool error |
| 2 | Usage or schema error |
| 3 | Clarification needed or not found |
| 4 | Conflict or version mismatch |
| 70 | Internal error |

Errors go to stderr. With `--json`, usage and internal errors also print
`{ok:false,error:{code,message}}` to stdout. Tool results retain their full
shape. Legacy `tools [--json]`, `describe <tool>`, `call <tool> [JSON|-]`
and `<tool_name> --parameter value` keep their existing exit codes.
`completions bash`, `completions zsh` and `completions fish` print shell scripts.

```sh
ghostpaw-codex belief add "Deploys go out on Tuesdays" --source explicit --category procedure
```

```sh
ghostpaw-codex search "when do we deploy" --json | jq '.data.results'
```

```sh
printf '%s' '{"beliefId":1}' | ghostpaw-codex belief show - --json
```

### Agent Skill

`SKILL.md` (repo root) and `skills/codex/SKILL.md` follow the
[Agent Skills](https://agentskills.io) format and ship in the npm package.
Copy `skills/codex/` into your agent's skills folder, or print it:

```bash
npx -y @ghostpaw/codex skill > SKILL.md
```

### Library

```bash
npm install @ghostpaw/codex
```

```ts
import { DatabaseSync } from 'node:sqlite';
import { initCodexTables, read, write } from '@ghostpaw/codex';

const db = new DatabaseSync('codex.db');
initCodexTables(db);

const { id } = write.remember(db, {
  claim: 'The API uses GraphQL with a REST fallback.',
  source: 'explicit',
  category: 'fact',
});
write.confirmBelief(db, id);
write.correctBelief(db, id, {
  claim: 'The API uses GraphQL exclusively; REST was retired.',
  source: 'observed',
  category: 'fact',
});

read.recall(db, 'graphql api'); // ranked, lineage-aware
read.listFlags(db);             // stale, fading, low-trust, single-evidence
```

Wire the same tools into any LLM SDK. Each tool carries a JSON Schema:

```ts
import { tools } from '@ghostpaw/codex';

for (const tool of tools.codexTools) {
  // tool.name, tool.description, tool.inputSchema, tool.handler(db, input)
}
```

Or embed the MCP server in your own process:

```ts
import { createCodexMcpServer } from '@ghostpaw/codex/mcp';
const server = createCodexMcpServer({ dbPath: './codex.db' });
```

## Why not MEMORY.md?

A markdown memory file works until it doesn't:

- **It only grows.** Agents append, rarely delete, and the file ends up in
  every prompt. Codex returns the few beliefs that match a query
  (FTS5 plus local embeddings, fused by rank).
- **Contradictions pile up.** "We use REST" and "REST was retired" sit side by
  side. Codex detects near-duplicates on every write, and corrections
  supersede the old belief while keeping the lineage.
- **Everything looks equally true.** A guess and a confirmed fact read the
  same in prose. Codex tracks source (explicit, observed, distilled,
  inferred), certainty and evidence count, and flags what is stale or weakly
  supported.
- **No time.** Codex decays freshness, so old beliefs surface for review
  instead of quietly steering behaviour.
- **Concurrent edits.** Two agents writing one file clobber each other. Codex
  is a SQLite database in WAL mode.

It stays local: one file you can copy, back up or inspect with any SQLite tool.
No server, no API key, no network.

## Tools

| Tool | What it does |
|---|---|
| `search_codex` | Hybrid lexical and semantic recall across active beliefs |
| `review_codex` | Dashboards: flags, status, trends, log |
| `inspect_codex_item` | One belief in full: metrics, lineage, nearby beliefs |
| `remember_belief` | Capture a claim with source, category and provenance |
| `revise_belief` | Confirm, correct, forget, defer or merge |
| `retire_belief` | Hard-delete for privacy or cleanup |
| `dismiss_proximity` | Mark two nearby beliefs as intentionally distinct |

Results are structured (`outcome: success | no_op | needs_clarification |
error`) with entities, next-step hints and recovery advice. The MCP server,
CLI, SKILL.md and plugin manifests are generated from this registry
(`npm run surfaces`) and drift-checked in CI.

## Performance

Measured with `npm run bench` on Node 24.14.0, Linux, Intel Xeon (shared
cloud vCPU), 10,000 beliefs in a file-backed database:

| Operation | p50 | p95 |
|---|---:|---:|
| `search_codex` (tool) | 3.6 ms | 5.0 ms |
| MCP `tools/call` search, stdio framing included | 3.8 ms | 4.2 ms |
| `read.recall` | 3.7 ms | 4.8 ms |
| `inspect_codex_item` | 3.5 ms | 3.8 ms |
| `write.remember` (includes proximity scan) | 4.5 ms | 5.6 ms |
| `review_codex` | 11.7 ms | 13.2 ms |

Cold start (process spawn to first response, median): `--version` 26 ms,
MCP `server/discover` 24 ms, first search against the 10,000-belief file
53 ms. Seeding 10,000 beliefs takes 2.2 s on disk.

Gzip sizes and cold-start medians are budgeted in `budgets.json` and enforced
by `npm run check`.

## The model

| Concept | Purpose |
|---|---|
| **Belief** | A claim held with certainty, evidence, provenance, decay and revision lineage |
| **Dismissal** | A record that two semantically close beliefs are intentionally distinct |
| **Flag** | A derived attention signal: stale, fading, low-trust, single-evidence or gap |
| **Proximity** | Semantic nearness between beliefs, detected on write |
| **Lineage** | The revision chain from corrections and supersessions, with version diffs |

State is derived, never toggled: freshness, strength, review priority and flags
are computed at read time.

## Package surface

| Import | Contents |
|---|---|
| `@ghostpaw/codex` | `initCodexTables`, `read`, `write`, `tools`, `skills`, `soul`, all types |
| `@ghostpaw/codex/mcp` | `createCodexMcpServer`, `serveCodexMcp`, generic MCP server helpers |
| `ghostpaw-codex` (bin) | Noun-verb CLI, legacy tool forms, `mcp`, `skill`, shell completions |
| `dist/mcp-server.js` | Standalone stdio MCP server entry (used by the MCP Bundle and the Dockerfile) |
| `SKILL.md`, `skills/codex/` | Agent Skill with 17 workflow references |

ESM and CommonJS, with type declarations for both.

## Documentation

| Document | Audience |
|---|---|
| [HUMAN.md](docs/HUMAN.md) | Developers using the `read` / `write` API |
| [LLM.md](docs/LLM.md) | Agent builders wiring `soul`, `tools` and `skills` |
| [docs/README.md](docs/README.md) | Architecture: model, invariants, scoring, source layout |
| [docs/entities/](docs/entities/) | Per-entity manuals with exact public API listings |
| [CHANGELOG.md](CHANGELOG.md) | Release history |

## Development

```bash
npm install
npm run check   # types, lint, zero-deps, tests, build, surfaces, size, API, consumer, startup, ratchet
npm run bench   # hot-path benchmarks at 10,000 beliefs
npm run surfaces  # regenerate SKILL.md, plugin manifests, server.json, mcpb manifest
```

`npm run check` is the single gate, locally and in CI. Size budgets
(`budgets.json`) and the public API snapshot (`api-surface.json`) can only
grow with an explicit approval tag in the commit message. The repo is pinned
to Node 24.14.0 via `.nvmrc`.

### Support

If this package helps your project, consider sponsoring its maintenance:

[![GitHub Sponsors](https://img.shields.io/badge/Sponsor-EA4AAA?style=for-the-badge&logo=github&logoColor=white)](https://github.com/sponsors/Anonyfox)

---

**[Anonyfox](https://anonyfox.com) • [MIT License](LICENSE)**
