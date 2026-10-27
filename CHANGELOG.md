# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Schema-derived noun-verb CLI commands, per-command help and bash/zsh/fish
  completions, with JSON stdin, file values and global output flags.
- Standalone binaries for linux-x64, linux-arm64, darwin-arm64, darwin-x64
  and windows-x64, with SHA256SUMS and build attestations.
- `install.sh` and `install.ps1` release installers and an external install
  check on Linux, macOS and Windows.

### Changed

- Noun-verb commands use exit codes 0 (success), 1 (tool error), 2 (usage),
  3 (clarification or not found), 4 (conflict) and 70 (internal error).
  Existing CLI forms retain their output and exit codes.
- npm and standalone CLI entries share their options and lazy MCP wiring.

## [0.3.2] - 2026-10-24

### Changed

- The homepage and MCP Registry website URL now point to ghostpaw.dev.

## [0.3.1] - 2026-10-24

### Changed

- `remember`, `inspect_codex_item` and `review_codex` are faster on large
  stores. Belief vectors for proximity checks are decoded once per connection
  and refreshed when the database changes, lineage is resolved in one recursive
  query instead of one query per step, and status and trend summaries read only
  the columns they need. At 10,000 beliefs p95 drops from 30-55 ms to under
  20 ms. Results, ordering and the schema are unchanged.
- `npm run check:deps` uses the shared zero-dependency check (manifest and
  packed tarball) and runs as its own CI and release step.
- Added AGENTS.md with contributor guidance.

## [0.3.0] - 2026-10-24

### Added

- `@ghostpaw/codex/mcp`: stdio MCP server generated from the tool registry.
  Speaks MCP 2026-07-28 (stateless requests, `server/discover`) and the
  initialize-based revisions 2025-11-25, 2025-06-18, 2025-03-26 and 2024-11-05.
- `ghostpaw-codex` CLI (`tools`, `describe`, `call`, per-tool flags, `mcp`,
  `skill`) and a standalone `dist/mcp-server.js` entry. Database path
  from `--db`, `GHOSTPAW_CODEX_DB` or `~/.ghostpaw/codex.db`.
- Agent Skill: root `SKILL.md` and `skills/codex/` with 17 workflow
  references, shipped in the npm package.
- Plugin manifests for Claude Code (`.claude-plugin/`) and portable agent
  plugins (`plugin.json`, `mcp.json`), an MCP Registry `server.json`
  (`io.github.GhostPawJS/codex`), an MCP Bundle (`server.mcpb`, attached to
  GitHub releases), `glama.json` and a Dockerfile.
- `npm run check`: one quality gate for local runs and CI covering types,
  lint, zero runtime dependencies, tests, build, generated-surface drift,
  gzip size budgets, the public API snapshot, a packed-tarball consumer
  install, cold-start budgets and a ratchet against silent growth.
- `npm run bench`: hot-path benchmarks at 10,000 beliefs.

### Changed

- Proximity detection on write loads full rows only for the selected
  matches, roughly halving `write.remember` latency at 10,000 beliefs.
- CI runs on every push and pull request on Node 24 and 26. Releases publish
  through npm trusted publishing with provenance.

[Unreleased]: https://github.com/GhostPawJS/codex/compare/v0.3.2...HEAD
[0.3.2]: https://github.com/GhostPawJS/codex/compare/v0.3.1...v0.3.2
[0.3.1]: https://github.com/GhostPawJS/codex/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/GhostPawJS/codex/compare/v0.2.6...v0.3.0
