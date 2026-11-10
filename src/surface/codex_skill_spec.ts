import { codexSkills } from '../skills/skill_registry.ts';
import { codexSoulTraits } from '../soul.ts';
import { codexMcpInstructions } from './codex_mcp_instructions.ts';
import { codexSurfaceTools } from './codex_surface_tools.ts';

export const codexSkillSpec = {
	name: 'codex',
	description:
		'Store, search, and revise local beliefs with evidence and revision history. Use when recalling preferences, capturing knowledge, or maintaining agent memory.',
	license: 'MIT',
	compatibility: 'Release binary needs no runtime installation. MCP stdio or ghostpaw-codex CLI.',
	bin: 'ghostpaw-codex',
	packageName: '@ghostpaw/codex',
	server: 'ghostpaw-codex',
	about: `${codexMcpInstructions}

## Running inside sandboxed agent harnesses

Inside a Codex CLI \`--sandbox workspace-write\` session, the database and its
parent directory must be inside a writable root, including SQLite's \`-wal\` and
\`-shm\` side files. A default DB under \`~/.ghostpaw\` outside those roots can fail
with \`SQLITE_CANTOPEN\` or \`EPERM\` (often exit 70; directory creation failures
may exit 2), even when normal shell permissions allow access. Put the DB inside the workspace with \`--db ./state/codex.db\`,
or set \`GHOSTPAW_CODEX_DB="$PWD/state/codex.db"\` for CLI/MCP use.

To use an external DB directory, add it when starting the OpenAI Codex CLI
(replace \`<dir-with-db>\` with its absolute path):

\`\`\`sh
codex exec --sandbox workspace-write --add-dir <dir-with-db> "Run the GhostPaw CLI"
\`\`\`

Alternatively, set \`sandbox_workspace_write.writable_roots\` in
\`~/.codex/config.toml\` before starting the session:

\`\`\`toml
[sandbox_workspace_write]
writable_roots = ["/absolute/dir-with-db"]
\`\`\`

## Unstable revision history

The \`unstable\` flag is derived at read time when a correction-connected lineage
contains more than two beliefs (normally the original plus two corrections).
Legacy supersessions without a reason also count; merge-only edges do not.
It signals revision history worth inspecting, not a false claim or low certainty.
Confirmation raises evidence and certainty but does not clear \`unstable\`, and
further corrections retain that history. Deferral hides all flags until its
expiry, then \`unstable\` returns if the history still qualifies. There is no
acknowledge/reset action: it clears only when the qualifying history no longer
exists (for example after hard deletion for an independent privacy need).
Do not delete history merely to silence the signal.

## What goes where

| Store | Use for |
| --- | --- |
| souls | Agent identity and voice. |
| codex | Beliefs with uncertainty and provenance: things that might be wrong or change. |
| affinity | People, organizations, agents, and their relationships. |
| questlog | Tasks and deadlines. |
| grimoire | Procedures and how-tos. |
| Plain memory/files | Stable operational facts. |

For boundary cases, keep identity in souls, a revisable claim about someone in codex linked to their affinity record, actionable work in questlog, and reusable steps in grimoire; leave stable setup details in plain memory/files.
`,
	installation: `## Install

Linux/macOS:

\`\`\`sh
curl -fsSL https://raw.githubusercontent.com/GhostPawJS/codex/main/install.sh | sh
\`\`\`

Installs \`~/.local/bin/ghostpaw-codex\` after checking SHA256SUMS.

Windows x64 (PowerShell):

\`\`\`powershell
irm https://raw.githubusercontent.com/GhostPawJS/codex/main/install.ps1 | iex
\`\`\`

Run tools as \`ghostpaw-codex ...\`; use \`~/.local/bin/ghostpaw-codex\` if it is not on PATH.`,
	cheatSheet: `## Quick reference

Search before adding with \`search_codex\` (CLI: \`ghostpaw-codex search\`): \`ghostpaw-codex search "deployment schedule"\`.

- \`ghostpaw-codex belief add "Deploys go out on Tuesdays." --source explicit --category fact\`
- \`ghostpaw-codex alias add <term> <alias>\` adds an optional directed query alias.
- \`ghostpaw-codex belief show <id>\`
- \`ghostpaw-codex belief confirm <id>\`
- \`ghostpaw-codex belief correct <id> --claim "Deploys go out on Wednesdays."\`
- WARNING: \`belief retire\` hard-deletes the whole lineage (the belief and all its predecessors/successors) and cannot be undone. Use \`belief forget\` for soft removal that keeps lineage.
- \`ghostpaw-codex belief forget <id>\`
- \`ghostpaw-codex belief defer <id> --deferred-until +7d\`
- \`ghostpaw-codex belief merge <id> <id> --claim "Combined claim"\`
- \`ghostpaw-codex review flags|status|log|trends|duplicates\`; use \`review status --by-prefix\` for active prefix counts and \`review duplicates --limit 20\` for immediate nearby pairs.
- \`--json\` prints full results on every read command (including tools, describe, version and guides); \`GHOSTPAW_OUTPUT=json\` opts all commands into JSON; other values leave defaults unchanged; \`--quiet\` prints ids only.
- \`ghostpaw-codex skill --list\` lists guides; \`ghostpaw-codex skill <guide>\` reads one.

Batch capture: \`ghostpaw-codex belief import @beliefs.jsonl --json\` or \`belief import - --dry-run --json\` for stdin. JSON arrays and JSON Lines contain belief objects (claim, source, category, optional topic/provenance/certainty/allowDuplicate). Tool: \`import_beliefs\` with items or input text and optional dryRun. One transaction per batch; failures report indexed errors in error.details.items and roll back everything. Success data.items contains indexed ids; dry-run ids are provisional.

Optional non-empty \`topic\` is supported by add, correct, merge and import. Corrections inherit omitted topics; merges inherit the primary or existing successor topic. Duplicate adds update explicitly supplied topics. Unset topics are omitted from JSON. Filter exact topics with \`search QUERY --topic work\` or \`review list --topic work\` (review_codex view list). Schema migration is automatic and idempotent.

Exit codes: 0 success, 1 operation failure, 2 usage, 3 missing belief, 4 conflict, 70 internal failure.

Database: \`~/.ghostpaw/codex.db\`. Override with \`--db <path>\` or \`GHOSTPAW_CODEX_DB\`. Default database opens print \`using default db <path>\` once on stderr; suppress with \`--quiet\` or \`GHOSTPAW_QUIET=1\`. Informational commands do not print the notice.

\`review duplicates\` suggests only pairs with the same normalized colon prefix or leading entity by default (case-insensitive, including multiword and hyphenated prefixes). Unprefixed claims pair with other unprefixed claims. Use \`review duplicates --cross-entity\` (\`crossEntity: true\` in \`review_codex\`) to include pairs across entities as before. Suggestions do not change beliefs; inspect each pair before merging or forgetting.

Belief JSON keeps the existing \`strength\` display tier and adds \`integrityTier\`, the certainty-only tier used by \`review status\`. Display \`strength\` is \`strong\` when certainty >= 0.4 and freshness >= 0.7; otherwise it falls back to the certainty tier. Thus certainty >= 0.7 always displays \`strong\`, even when stale. \`integrityTier\` is \`strong\` at certainty >= 0.7, \`fading\` at >= 0.4, otherwise \`faint\`. Integrity counts strong active beliefs divided by all active beliefs. Human \`belief show\` labels these as \`display strength\` and \`integrity tier\`; a fresh inferred belief at certainty 0.5 can display strong while its integrity tier is fading.

When running the CLI or MCP server from a sandboxed Codex CLI job (\`codex exec -s workspace-write\`), put the database inside the working directory, for example \`ghostpaw-codex --db ./codex.db review status\`. An external DB folder needs an added writable root: \`codex exec -s workspace-write --add-dir /path/to/db-folder ...\`. Otherwise SQLite cannot open the database and the CLI exits with code 70.

Search ranks colon-prefixed entities matching the leading query tokens first (case-insensitive, including multiword and hyphenated entities), also with \`--prefix\`. Raw \`--fts\` and quoted phrase ranking are unchanged.`,
	tools: codexSurfaceTools,
	workflows: codexSkills,
	principles: codexSoulTraits.map((trait) => trait.principle),
};
