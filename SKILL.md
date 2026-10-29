---
name: codex
description: "Store, search, and revise local beliefs with evidence and revision history. Use when recalling preferences, capturing knowledge, or maintaining agent memory."
license: "MIT"
compatibility: "Release binary needs no runtime installation. MCP stdio or ghostpaw-codex CLI."
---

# codex

## Install

Linux/macOS:

```sh
curl -fsSL https://raw.githubusercontent.com/GhostPawJS/codex/main/install.sh | sh
```

Installs `~/.local/bin/ghostpaw-codex` after checking SHA256SUMS.

Windows x64 (PowerShell):

```powershell
irm https://raw.githubusercontent.com/GhostPawJS/codex/main/install.ps1 | iex
```

Run tools as `ghostpaw-codex ...`; use `~/.local/bin/ghostpaw-codex` if it is not on PATH.

## Quick reference

Search before adding with `search_codex` (CLI: `ghostpaw-codex search`): `ghostpaw-codex search "deployment schedule"`.

- `ghostpaw-codex belief add "Deploys go out on Tuesdays." --source explicit --category fact`
- `ghostpaw-codex alias add <term> <alias>` adds an optional directed query alias.
- `ghostpaw-codex belief show <id>`
- `ghostpaw-codex belief confirm <id>`
- `ghostpaw-codex belief correct <id> --claim "Deploys go out on Wednesdays."`
- `ghostpaw-codex belief forget <id>`
- `ghostpaw-codex belief defer <id> --deferred-until +7d`
- `ghostpaw-codex belief merge <id> <id> --claim "Combined claim"`
- `ghostpaw-codex review flags|status|log|trends`
- `--json` prints full results; `--quiet` prints ids only.
- `ghostpaw-codex skill --list` lists guides; `ghostpaw-codex skill <guide>` reads one.

Exit codes: 0 success, 1 operation failure, 2 usage, 3 missing belief, 4 conflict, 70 internal failure.

Database: `~/.ghostpaw/codex.db`. Override with `--db <path>` or `GHOSTPAW_CODEX_DB`.

Codex is a local belief and memory engine that records claims, evidence, certainty, and revision history. Search before you remember to avoid duplicates and recover relevant context. Inspect before you revise; use revise for confirmation, correction, merging, forgetting, or deferral. Use retire only for permanent erasure. Certainty is not truth: confidence and derived flags guide attention, never prove a claim. Preserve honest lineage when understanding changes and ask for clarification when the intended action is ambiguous.

## Calling tools

MCP: connect to ghostpaw-codex, then call a tool by name with its JSON arguments.

CLI: `ghostpaw-codex call <tool> '<JSON object>'` or `ghostpaw-codex <tool> --parameter value`.

Inspect schemas with `ghostpaw-codex describe <tool>`. Use `--db <path>` to select a database.

## search_codex (CLI: ghostpaw-codex search)

Search active beliefs by natural language query. Returns ranked matches with recall scores and transparency metadata.

Use when: Use this to find beliefs about a topic before acting on them. Always search before creating a new belief to avoid duplicates.

Not for: Do not use this for browsing all beliefs — use review_codex with the status or flags view instead.

Read-only.

| Parameter | Type | Required | Values / description |
| --- | --- | --- | --- |
| query | string | yes | Free-form natural language query. |
| limit | integer | no | Maximum number of results. |
| minScore | number | no | Minimum final recall score, default 0.01; relative relevance filtering also applies. |
| category | string | no | preference, fact, procedure, capability, custom. Optional category filter. |
| source | string | no | explicit, observed, distilled, inferred. Optional source filter. |

Example: `ghostpaw-codex call search_codex '{"query":"deployment schedule"}'`

## review_codex (CLI: ghostpaw-codex review)

Load a codex review surface: flags for beliefs needing attention, status for portfolio health, log for recent activity, or trends for time-based patterns.

Use when: Use this when you need an overview of the codex state rather than a specific belief. Start with flags for maintenance, status for a dashboard, or log for recent changes.

Not for: Do not use this to find a specific belief by topic — use search_codex instead. Do not use this to inspect one belief deeply — use inspect_codex_item.

Read-only.

| Parameter | Type | Required | Values / description |
| --- | --- | --- | --- |
| view | string | yes | flags, status, log, trends. Which codex review surface to load. Flags suppress single_evidence, low_trust and gap for beliefs created less than seven days ago. |
| limit | integer | no | Maximum entries for the log view. |
| now | integer | no | Optional timestamp override for freshness computation. |

Example: `ghostpaw-codex call review_codex '{"view":"flags"}'`

## inspect_codex_item (CLI: ghostpaw-codex belief show)

Inspect one belief in full detail: certainty, freshness, strength, source, category, lineage chain, proximity to similar beliefs, and version diff when applicable.

Use when: Use this after finding a belief through search_codex or review_codex to understand it deeply before deciding whether to confirm, correct, or forget it.

Not for: Do not use this for bulk browsing — use review_codex for lists. Do not call this without a specific belief id.

Read-only.

| Parameter | Type | Required | Values / description |
| --- | --- | --- | --- |
| beliefId | integer | yes | Belief identifier. |

Example: `ghostpaw-codex call inspect_codex_item '{"beliefId":1}'`

## remember_belief (CLI: ghostpaw-codex belief add)

Capture a belief from a claim, source, and category. Reuses active normalized duplicates unless allowDuplicate is set, and detects nearby beliefs.

Use when: Use this when a new proposition should enter the codex. Always search first to check whether the belief already exists — prefer confirming or correcting an existing belief over creating a duplicate.

Not for: Do not use this to update an existing belief. Use revise_belief with the correct, confirm, or merge action instead.

Writes: writes_state.

| Parameter | Type | Required | Values / description |
| --- | --- | --- | --- |
| claim | string | yes | The proposition being asserted. |
| source | string | yes | explicit, observed, distilled, inferred. Where the belief came from. |
| category | string | yes | preference, fact, procedure, capability, custom. What kind of claim. |
| certainty | number | no | Optional initial certainty 0–1. |
| provenance | string | no | Optional origin reference. |
| allowDuplicate | boolean | no | Create a separate belief even if the normalized claim exists. |

Example: `ghostpaw-codex call remember_belief '{"claim":"Deploys go out on Tuesdays.","source":"explicit","category":"procedure"}'`

## revise_belief (CLI: ghostpaw-codex belief confirm)

Revise an existing belief: confirm it still holds, correct it with a new claim, merge multiple beliefs into one, forget it from active recall, or defer its next flag review.

Use when: Use this after inspecting a belief to act on it. Choose the action that matches the situation: confirm for reinforcement, correct for changed understanding, merge for consolidation, forget for removal from active recall, defer for postponing review.

Not for: Do not use this to create a new belief — use remember_belief. Do not use this to permanently delete a belief — use retire_belief.

Writes: writes_state.

| Parameter | Type | Required | Values / description |
| --- | --- | --- | --- |
| action | string | yes | confirm, correct, merge, forget, defer. Revision action. |
| beliefId | integer | no | Single belief id. |
| beliefIds | array of integer | no | Belief ids for merge. |
| claim | string | no | Replacement or merged claim. |
| successorId | integer | no | Existing active successor belief id. |
| deferredUntil | integer | no | Deferred review date: tomorrow, +3d, YYYY-MM-DD, DD.MM.YYYY, ISO with zone, or epoch ms. Calendar dates use the process time zone. |
| source | string | no | explicit, observed, distilled, inferred. Optional replacement source. |
| category | string | no | preference, fact, procedure, capability, custom. Optional replacement category. |
| certainty | number | no | Optional certainty override. |
| provenance | string | no | Optional origin reference appended to provenanceSources; the legacy provenance view is preserved when omitted. |

Example: `ghostpaw-codex call revise_belief '{"action":"confirm","beliefId":1}'`

## retire_belief (CLI: ghostpaw-codex belief retire)

Permanently delete a belief and its entire lineage chain. No trace remains. This is for privacy and hard erasure, not normal revision.

Use when: Use this only for privacy cleanup or hard erasure. The belief and all of its lineage (predecessors and successors) will be destroyed.

Not for: Do not use this for normal belief lifecycle — use revise_belief with the forget action to preserve the audit trail.

Writes: writes_state.

| Parameter | Type | Required | Values / description |
| --- | --- | --- | --- |
| beliefId | integer | yes | Belief id to delete. |

Example: `ghostpaw-codex call retire_belief '{"beliefId":1}'`

## dismiss_proximity (CLI: ghostpaw-codex proximity dismiss)

Record that two beliefs are not meaningfully related despite proximity detection. Uses exponential backoff — the pair will resurface less frequently with each dismissal.

Use when: Use this after inspecting two proximate beliefs and determining they are not duplicates or in conflict. The dismissal suppresses the pair in future proximity results.

Not for: Do not use this if the beliefs are genuinely related — instead use revise_belief to merge, correct, or forget one of them.

Writes: writes_state.

| Parameter | Type | Required | Values / description |
| --- | --- | --- | --- |
| beliefA | integer | yes | First belief id. |
| beliefB | integer | yes | Second belief id. |

Example: `ghostpaw-codex call dismiss_proximity '{"beliefA":1,"beliefB":2}'`

## Workflow guides

- `ghostpaw-codex skill search-and-retrieve-beliefs`: Find relevant beliefs by natural-language query, then inspect exact candidates in detail without scanning the whole codex.
- `ghostpaw-codex skill capture-beliefs-well`: Capture one belief per claim with correct source, category, and certainty, always searching first to avoid duplicates.
- `ghostpaw-codex skill review-flags-batch`: Process a queue of flagged beliefs, triaging each by its reason code with the right revision verb.
- `ghostpaw-codex skill resolve-near-duplicate-beliefs`: Decide whether two proximate beliefs are duplicates, successors, complementary, or genuinely distinct, then act accordingly.
- `ghostpaw-codex skill correct-belief-lineage-honestly`: Use correct instead of forget-and-remember so lineage preserves what changed, when, and why.
- `ghostpaw-codex skill handle-ambiguous-belief-updates`: Choose the right verb when new information collides with an existing belief: confirm, correct, merge, forget-with-successor, or dismiss.
- `ghostpaw-codex skill process-stale-beliefs`: Refresh or retire beliefs whose freshness has dropped too far, using flags to identify them and the right verb to resolve each.
- `ghostpaw-codex skill run-calibration-pass`: Detect and respond to systematic overconfidence by inspecting calibration alerts and high-certainty revision patterns in trends.
- `ghostpaw-codex skill defer-beliefs-pending-outcomes`: Postpone flag processing for beliefs that cannot be judged yet by deferring them until a future date.
- `ghostpaw-codex skill erase-beliefs-for-privacy`: Choose between forget (soft removal with audit trail) and retire (hard delete) based on privacy and compliance requirements.
- `ghostpaw-codex skill batch-ingest-with-deduplication`: High-volume capture that avoids creating duplicates by searching before each remember and resolving overlaps immediately.
- `ghostpaw-codex skill diagnose-declining-integrity`: Find the root cause when codex integrity is dropping by analyzing status, flags, and trends systematically.
- `ghostpaw-codex skill upgrade-source-evidence`: Promote a belief from a weaker source to a stronger one when direct evidence arrives, using correct to preserve lineage.
- `ghostpaw-codex skill pre-register-beliefs-before-decisions`: Anchor beliefs with honest certainty before outcomes arrive to enable calibration tracking.
- `ghostpaw-codex skill direct-supersession-between-beliefs`: Express that one belief already covers another by forgetting the weaker one with a successor pointer, without creating new entries.
- `ghostpaw-codex skill dismiss-false-proximity-pairs`: Suppress proximity pairs that are topically near but genuinely distinct, using exponential backoff to handle recurrence.
- `ghostpaw-codex skill monitor-portfolio-health`: Regular status and trends review as a maintenance ritual to catch problems before they compound.

## Principles

- Recall before you act, every time.
- One claim per belief, honestly weighted.
- Prefer lineage over erasure.
- Read derived signals before prescribing action.
- Choose the smallest honest mutation.
- Maintenance is the value, not capture.

## Without the binary

For npm-based environments (Node 24+), run tools with `npx -y @ghostpaw/codex ...`.

Harnesses embedding it in code can import `@ghostpaw/codex` as a library.
