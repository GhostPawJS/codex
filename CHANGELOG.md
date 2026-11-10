# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- Document the correction-history unstable flag, its persistence through confirmation, and temporary suppression by deferral.

### Changed

- Document writable database roots for sandboxed agent harnesses in the README and generated agent skill. Clarify which GhostPaw store owns identity, beliefs, relationships, work, procedures, and stable operational facts.

- Add atomic JSON/JSONL belief imports with dry runs and indexed results, and optional belief topics with migration and list/search filters.

### Added

- Add `--cross-entity` / `crossEntity` to include duplicate review candidates across claim prefixes.
- Expose the certainty-only `integrityTier` alongside the existing display `strength`, with distinct labels in belief details.
- Document writable database paths for CLI and MCP use in sandboxed Codex CLI jobs.

### Changed

- Restrict duplicate review suggestions to matching normalized claim prefixes by default; unprefixed claims pair together.

## [0.6.4] - 2026-11-05

### Added

- Without `--db` or `GHOSTPAW_CODEX_DB`, the CLI prints `using default db <path>` on stderr; `--quiet` or `GHOSTPAW_QUIET=1` suppresses it.

- Accept `--json` on every CLI read command.
- Support `GHOSTPAW_OUTPUT=json` as an opt-in CLI output default.
- Warn on stderr that `belief retire` irreversibly deletes the whole lineage; document `belief forget` for soft removal.

- `review status --by-prefix` counts active claim prefixes (`byPrefix`, `prefixCounts` in the facade).
- `review duplicates --limit` lists nearby active pairs immediately, honoring proximity dismissals.

### Changed

- Search ranks beliefs first whose `prefix:` matches the leading query words (default and `--prefix` modes; `--fts` ranking unchanged).

## [0.6.3] - 2026-11-04

### Added

- `belief add` names the nearest active belief (id, claim, similarity) when similarity is at least 0.7, in text, `--compact` and JSON (`nearest`) output.
- `search --prefix <text>` (tool: `prefix`) limits matches to claims starting with that text; a query is still required.
- Opt-in raw FTS5 search syntax through CLI `--fts` and tool input `fts`.
- `review status` prints its integrity denominator and counts single-evidence beliefs younger than 7 days as `new, unconfirmed` (`newUnconfirmed`, `denominator` fields). Existing values are unchanged.

### Changed

- Search escapes its input by default: punctuation such as `:` and `-` matches literally, and input wrapped in double quotes is searched as one phrase. Pass `--fts` (tool: `fts: true`) for FTS5 operators.
- Remove landing page sources and the automated site deployment workflow; retain the demo build tooling. Demo fonts can be supplied through `DOCS_FONT_DIR`.

### Fixed

- `belief correct` text output starts with `superseded #<old> → #<new>`.
- `--help` works after positional arguments at any command depth, e.g. `belief add '<claim>' --help`.
- Invalid `--fts` queries print one line and exit 2.
- A `--db` path whose parent cannot be created reports `Cannot create database directory <dir>: <reason>` and exits 2.
- Cline install guide: verify the configuration with `cline config mcp` and separate direct tool handler checks from MCP stdio checks.

## [0.6.2] - 2026-10-30

### Fixed

- `belief correct` on a belief that 0.6.0 stored with provenance failed with "database disk image is malformed". The update trigger now fires only when the claim changes, so one update writes the search index once. Migration replaces legacy update triggers before provenance backfill and rebuilds the search index; repeated initialization remains safe.
- Review `--now` accepts negative and unsigned relative day offsets such as `-3d` and `30d`, alongside existing formats. Invalid values are named in usage errors.
- Explicit `--db` paths now create missing parent directories recursively with mode 0700 and new database files with mode 0600.
- Documented the opt-in `@file` rule and literal leading `@` behavior of current CLI arguments.

## [0.6.1] - 2026-10-29

### Added

- Append-only `provenanceSources` on belief records, retaining origin references across duplicate additions, confirmations, corrections, merges, deferrals and forgetting. The legacy `provenance` field remains readable.
- Active successor ids in belief details and full-chain successor hints in revision errors and CLI output.

### Fixed

- Belief group help lists only belief verbs; deferral help shows a date string type. Review `--now` accepts relative days, calendar dates, zoned timestamps and epoch milliseconds, including historical values.
- Merge into an existing successor accepts an omitted claim. Unchanged normalized corrections reuse the current belief and return a tool no-op.
- Small corpora avoid the common-term search cap; merge fan-in alone no longer produces instability flags after the grace period.
- Legacy active normalized duplicates consolidate once on schema upgrade, retaining evidence, sources and lineage while preserving subsequent explicit duplicates.
- New CLI and MCP database files use mode 0600 and newly created parent directories use mode 0700, preserving existing permissions.

## [0.6.0] - 2026-10-28

### Added

- Optional provenance on every belief revision verb. Search and belief detail text include stored provenance.
- Short CLI flags: -q for --quiet, -j for --json, -c for --claim, and -h for --help.
- llms-install.md: binary install per OS and CPU with checksum verification, a Cline MCP configuration with absolute command paths and a test call. The README MCP section has a Cline entry.
- --allow-duplicate permits creating a separate belief with an existing normalized claim.

### Changed

- CLI values are literal unless an argument explicitly supports file input. No Codex argument enables file input; leading @ and @@ remain unchanged. Use JSON stdin for long input.
- Adding an active normalized duplicate returns its existing id with outcome no_op and a duplicate warning. Detection runs inside an immediate transaction, including concurrent writes and databases with pre-existing duplicates.
- Search requires a lexical token match or a bounded token spelling match. Unrelated queries return an empty result with one no_match warning and text “No matching beliefs.”
- Search weights derive from smoothed corpus document frequency without word lists. The three-result common-term cap applies only when all matched terms occur in nearly every document of a sufficiently large corpus.
- CLI merge requires --claim instead of concatenating source claims. The library fallback remains available for compatibility.
- Invalid claims, aliases, certainty outside [0,1] and missing revision input return usage exit code 2. Explicit database paths with a missing parent directory return exit code 3 without creating the directory.
- Alias JSON lists use the {ok, data} envelope; quiet lists print one term and alias per line. Repeated adds report “Alias exists”.
- Text timestamps include the process time zone label. Deferral help lists accepted forms and explains the process time zone for calendar dates.
- Fresh moderate-certainty beliefs display fading strength only after freshness decays.

### Fixed

- Correct and confirm preserve provenance when omitted. Merges preserve provenance when all inputs agree, including an existing successor, and otherwise clear it unless explicitly supplied.
- Newly merged beliefs receive a grace period before inherited lineage produces an unstable flag.
- Revising a superseded belief reports its successor id; belief detail text identifies supersession.
- Deferred log entries are labelled deferred and entries sort by last change.
- Each revision command has its own help description. Guides and generated skill documentation pair tool names with CLI commands.
- Database startup installs the busy timeout before enabling WAL for concurrent cold starts.

## [0.5.2] - 2026-10-28

### Removed

- Built-in related-term query expansion introduced in 0.5.1. Search is lexical with IDF-like weighting; a query that shares only a very common word with stored beliefs returns at most three results and a low-signal warning.

### Added

- Optional user-defined query aliases, managed with `alias add|remove|list` or `write.addQueryAlias`, `write.removeQueryAlias` and `read.listQueryAliases`. Aliases are empty by default.
- `--version --short` prints the bare version; `--version --json` prints `name`, `version`, `variant` and `target`.

### Changed

- Install instructions state that the one-line installers change PATH for the current shell only and never edit `~/.profile`, with a separate line that persists it and a pinned-version example.

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

[Unreleased]: https://github.com/GhostPawJS/codex/compare/v0.6.4...HEAD
[0.6.4]: https://github.com/GhostPawJS/codex/compare/v0.6.3...v0.6.4
[0.6.3]: https://github.com/GhostPawJS/codex/compare/v0.6.2...v0.6.3
[0.6.2]: https://github.com/GhostPawJS/codex/compare/v0.6.1...v0.6.2
[0.6.0]: https://github.com/GhostPawJS/codex/compare/v0.5.2...v0.6.0
[0.5.2]: https://github.com/GhostPawJS/codex/compare/v0.5.1...v0.5.2
[0.5.1]: https://github.com/GhostPawJS/codex/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/GhostPawJS/codex/compare/v0.4.1...v0.5.0
[0.4.1]: https://github.com/GhostPawJS/codex/compare/v0.4.0...v0.4.1
[0.4.0]: https://github.com/GhostPawJS/codex/compare/v0.3.2...v0.4.0
[0.3.2]: https://github.com/GhostPawJS/codex/compare/v0.3.1...v0.3.2
[0.3.1]: https://github.com/GhostPawJS/codex/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/GhostPawJS/codex/compare/v0.2.6...v0.3.0
