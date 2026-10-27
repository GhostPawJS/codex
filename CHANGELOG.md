# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.5.1] - 2026-10-27

### Fixed

- Expand everyday query words with related terms (for example "class" and "play" for "mains a Warrior") so relevance no longer depends on insertion order when a query shares only a name with stored claims.

## [0.5.0] - 2026-10-27

### Changed

- Print compact text for noun-verb CLI commands in terminals and pipes; support full JSON and result ids through `--json` and `--quiet`.
- Include recovery hints and missing flags in CLI errors, the resolved database in help, and the binary name in version output.
- Restrict revision help and flags to the selected action; accept local calendar dates, relative days, ISO date-times and epoch milliseconds for CLI deferral.
- Expose workflow guides through `skill --list` and `skill <guide>`, with help and name suggestions; render command-based guide references, nested parameters, array element types and validated examples in the binary-first skill reference.
- Return protocol errors with recovery hints for malformed tool input instead of crashes or undefined results.
- Weight search query tokens by document frequency, filter weak relative matches, and cap common-term-only results with a warning.
- Combine evidence and retain the strongest default certainty when merging beliefs; migrate supersession reasons to distinguish corrections, merges and forgetting in logs and calibration trends.
- Allow seven days from creation before evidence, trust and category-gap review flags apply.
- Print search warnings on stderr in text mode; `call`, `describe` and tool-flag invocations keep JSON output.
- Default installation instructions to the release binary in the README and generated skill, with npm and library alternatives.
- Include binary target, npm or library variant in human CLI version output.
- Accept explicit installer targets with host validation and the macOS Rosetta exception.
- Accept CLI flag values starting with dashes unless they resemble a named flag.

## [0.4.1] - 2026-10-27

### Added

- MCP Registry: `server.json` lists the MCP Bundle (`server.mcpb` release asset, with its SHA-256) as a second package next to npm. The Release workflow points it at each new tag's asset before publishing.
- README: terminal screenshot of a session with the 0.4.0 binary.

## [0.4.0] - 2026-10-27

### Added

- 11 noun-verb CLI commands derived from the tool schemas:
  `search`, `review`, `belief add|show|retire|confirm|correct|merge|forget|defer`
  and `proximity dismiss`. Each has `--help`. Global flags: `--db`, `--json`,
  `--quiet`, `--compact`, `--version`. `completions bash|zsh|fish` prints a
  completion script.
- Standalone binaries (Node 26.12.1 single executable) for 5 targets:
  linux-x64, linux-arm64, darwin-arm64, darwin-x64 and windows-x64. Each
  release carries SHA256SUMS and a GitHub build provenance attestation per
  archive. Binaries are unsigned; macOS builds carry an ad-hoc signature.
- `install.sh` and `install.ps1` install the binary from the release and
  refuse an archive whose SHA-256 does not match SHA256SUMS.
- An install check workflow installs each published release on
  ubuntu-24.04, macos-15 and windows-2025 and runs `--version`, a write and
  an MCP `initialize` + `tools/list` exchange.

### Changed

- Noun-verb commands exit with 0 (success or no_op), 1 (tool error),
  2 (usage error), 3 (needs clarification or not found), 4 (conflict) or
  70 (internal error). The existing tool-name forms (`remember_belief --claim`,
  `call`, `describe`, `tools`) keep their output and exit codes.
- `SurfaceTool` has an optional `cli` field for the command mapping. No other
  public type changed.

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

[Unreleased]: https://github.com/GhostPawJS/codex/compare/v0.5.1...HEAD
[0.5.1]: https://github.com/GhostPawJS/codex/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/GhostPawJS/codex/compare/v0.4.1...v0.5.0
[0.4.1]: https://github.com/GhostPawJS/codex/compare/v0.4.0...v0.4.1
[0.4.0]: https://github.com/GhostPawJS/codex/compare/v0.3.2...v0.4.0
[0.3.2]: https://github.com/GhostPawJS/codex/compare/v0.3.1...v0.3.2
[0.3.1]: https://github.com/GhostPawJS/codex/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/GhostPawJS/codex/compare/v0.2.6...v0.3.0
