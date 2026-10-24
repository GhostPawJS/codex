---
name: codex
description: "Store, search, and revise local beliefs with evidence and revision history. Use when recalling preferences, capturing knowledge, or maintaining agent memory."
license: "MIT"
compatibility: "Node.js 24 or newer. MCP stdio or ghostpaw-codex CLI."
---

# codex

Codex is a local belief and memory engine that records claims, evidence, certainty, and revision history. Search before you remember to avoid duplicates and recover relevant context. Inspect before you revise; use revise for confirmation, correction, merging, forgetting, or deferral. Use retire only for permanent erasure. Certainty is not truth: confidence and derived flags guide attention, never prove a claim. Preserve honest lineage when understanding changes and ask for clarification when the intended action is ambiguous.

## Calling tools

MCP: connect to ghostpaw-codex, then call a tool by name with its JSON arguments.

CLI: `ghostpaw-codex call <tool> '<JSON object>'` or `ghostpaw-codex <tool> --parameter value` (without a global install: `npx -y @ghostpaw/codex <tool> ...`).

Inspect schemas with `ghostpaw-codex describe <tool>`. Use `--db <path>` to select a database.

## search_codex

Search active beliefs by natural language query. Returns ranked matches with recall scores and transparency metadata.

Use when: Use this to find beliefs about a topic before acting on them. Always search before creating a new belief to avoid duplicates.

Not for: Do not use this for browsing all beliefs — use review_codex with the status or flags view instead.

Read-only.

| Parameter | Type | Required | Values / description |
| --- | --- | --- | --- |
| query | string | yes | Free-form natural language query. |
| limit | integer | no | Maximum number of results. |
| minScore | number | no | Minimum recall score threshold. |
| category | string | no | preference, fact, procedure, capability, custom. Optional category filter. |
| source | string | no | explicit, observed, distilled, inferred. Optional source filter. |

## review_codex

Load a codex review surface: flags for beliefs needing attention, status for portfolio health, log for recent activity, or trends for time-based patterns.

Use when: Use this when you need an overview of the codex state rather than a specific belief. Start with flags for maintenance, status for a dashboard, or log for recent changes.

Not for: Do not use this to find a specific belief by topic — use search_codex instead. Do not use this to inspect one belief deeply — use inspect_codex_item.

Read-only.

| Parameter | Type | Required | Values / description |
| --- | --- | --- | --- |
| view | string | yes | flags, status, log, trends. Which codex review surface to load. |
| limit | integer | no | Maximum entries for the log view. |
| now | integer | no | Optional timestamp override for freshness computation. |

## inspect_codex_item

Inspect one belief in full detail: certainty, freshness, strength, source, category, lineage chain, proximity to similar beliefs, and version diff when applicable.

Use when: Use this after finding a belief through search_codex or review_codex to understand it deeply before deciding whether to confirm, correct, or forget it.

Not for: Do not use this for bulk browsing — use review_codex for lists. Do not call this without a specific belief id.

Read-only.

| Parameter | Type | Required | Values / description |
| --- | --- | --- | --- |
| beliefId | integer | yes | Belief identifier. |

## remember_belief

Create a new belief from a claim, source, and category. Automatically detects nearby beliefs for duplicate awareness.

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

## revise_belief

Revise an existing belief: confirm it still holds, correct it with a new claim, merge multiple beliefs into one, forget it from active recall, or defer its next flag review.

Use when: Use this after inspecting a belief to act on it. Choose the action that matches the situation: confirm for reinforcement, correct for changed understanding, merge for consolidation, forget for removal from active recall, defer for postponing review.

Not for: Do not use this to create a new belief — use remember_belief. Do not use this to permanently delete a belief — use retire_belief.

Writes: writes_state.

| Parameter | Type | Required | Values / description |
| --- | --- | --- | --- |
| action | string | yes | confirm, correct, merge, forget, defer. Revision action. |
| beliefId | integer | no | Single belief id. |
| beliefIds | array | no | Belief ids for merge. |
| claim | string | no | Replacement or merged claim. |
| successorId | integer | no | Existing active successor belief id. |
| deferredUntil | integer | no | Future timestamp for deferred review. |
| source | string | no | explicit, observed, distilled, inferred. Optional replacement source. |
| category | string | no | preference, fact, procedure, capability, custom. Optional replacement category. |
| certainty | number | no | Optional certainty override. |

## retire_belief

Permanently delete a belief and its entire lineage chain. No trace remains. This is for privacy and hard erasure, not normal revision.

Use when: Use this only for privacy cleanup or hard erasure. The belief and all of its lineage (predecessors and successors) will be destroyed.

Not for: Do not use this for normal belief lifecycle — use revise_belief with the forget action to preserve the audit trail.

Writes: writes_state.

| Parameter | Type | Required | Values / description |
| --- | --- | --- | --- |
| beliefId | integer | yes | Belief id to delete. |

## dismiss_proximity

Record that two beliefs are not meaningfully related despite proximity detection. Uses exponential backoff — the pair will resurface less frequently with each dismissal.

Use when: Use this after inspecting two proximate beliefs and determining they are not duplicates or in conflict. The dismissal suppresses the pair in future proximity results.

Not for: Do not use this if the beliefs are genuinely related — instead use revise_belief to merge, correct, or forget one of them.

Writes: writes_state.

| Parameter | Type | Required | Values / description |
| --- | --- | --- | --- |
| beliefA | integer | yes | First belief id. |
| beliefB | integer | yes | Second belief id. |

## Workflow guides

- [search-and-retrieve-beliefs](skills/codex/references/search-and-retrieve-beliefs.md): Find relevant beliefs by natural-language query, then inspect exact candidates in detail without scanning the whole codex.
- [capture-beliefs-well](skills/codex/references/capture-beliefs-well.md): Capture one belief per claim with correct source, category, and certainty, always searching first to avoid duplicates.
- [review-flags-batch](skills/codex/references/review-flags-batch.md): Process a queue of flagged beliefs, triaging each by its reason code with the right revision verb.
- [resolve-near-duplicate-beliefs](skills/codex/references/resolve-near-duplicate-beliefs.md): Decide whether two proximate beliefs are duplicates, successors, complementary, or genuinely distinct, then act accordingly.
- [correct-belief-lineage-honestly](skills/codex/references/correct-belief-lineage-honestly.md): Use correct instead of forget-and-remember so lineage preserves what changed, when, and why.
- [handle-ambiguous-belief-updates](skills/codex/references/handle-ambiguous-belief-updates.md): Choose the right verb when new information collides with an existing belief: confirm, correct, merge, forget-with-successor, or dismiss.
- [process-stale-beliefs](skills/codex/references/process-stale-beliefs.md): Refresh or retire beliefs whose freshness has dropped too far, using flags to identify them and the right verb to resolve each.
- [run-calibration-pass](skills/codex/references/run-calibration-pass.md): Detect and respond to systematic overconfidence by inspecting calibration alerts and high-certainty revision patterns in trends.
- [defer-beliefs-pending-outcomes](skills/codex/references/defer-beliefs-pending-outcomes.md): Postpone flag processing for beliefs that cannot be judged yet by deferring them until a future date.
- [erase-beliefs-for-privacy](skills/codex/references/erase-beliefs-for-privacy.md): Choose between forget (soft removal with audit trail) and retire (hard delete) based on privacy and compliance requirements.
- [batch-ingest-with-deduplication](skills/codex/references/batch-ingest-with-deduplication.md): High-volume capture that avoids creating duplicates by searching before each remember and resolving overlaps immediately.
- [diagnose-declining-integrity](skills/codex/references/diagnose-declining-integrity.md): Find the root cause when codex integrity is dropping by analyzing status, flags, and trends systematically.
- [upgrade-source-evidence](skills/codex/references/upgrade-source-evidence.md): Promote a belief from a weaker source to a stronger one when direct evidence arrives, using correct to preserve lineage.
- [pre-register-beliefs-before-decisions](skills/codex/references/pre-register-beliefs-before-decisions.md): Anchor beliefs with honest certainty before outcomes arrive to enable calibration tracking.
- [direct-supersession-between-beliefs](skills/codex/references/direct-supersession-between-beliefs.md): Express that one belief already covers another by forgetting the weaker one with a successor pointer, without creating new entries.
- [dismiss-false-proximity-pairs](skills/codex/references/dismiss-false-proximity-pairs.md): Suppress proximity pairs that are topically near but genuinely distinct, using exponential backoff to handle recurrence.
- [monitor-portfolio-health](skills/codex/references/monitor-portfolio-health.md): Regular status and trends review as a maintenance ritual to catch problems before they compound.

## Principles

- Recall before you act, every time.
- One claim per belief, honestly weighted.
- Prefer lineage over erasure.
- Read derived signals before prescribing action.
- Choose the smallest honest mutation.
- Maintenance is the value, not capture.
