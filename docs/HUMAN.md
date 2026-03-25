# Codex — Human Usage

This document is for human operators and developers using Codex directly in
code.

It assumes you are working with the low-level public library surface exposed at
the package root through `initCodexTables`, `read`, `write`, `types`, and
`errors`.

If you are wiring Codex into an agent or LLM harness, read [`LLM.md`](LLM.md)
instead. That document covers the additive `soul`, `tools`, and `skills`
runtime. This document is about humans using the underlying library directly.

Contracts and vocabulary live in [`CONCEPT.md`](../CONCEPT.md). Exact entity
details live in the entity manuals under [`entities/`](entities/).

## Which Surface To Use

Human-facing direct usage usually looks like:

```ts
import { errors, initCodexTables, read, types, write } from '@ghostpaw/codex';
```

Use this surface when a human is still deciding what to capture, how to model
it, and when to revise — in application code, scripts, CLIs, backends, or
custom interfaces.

## Package Imports

| Symbol | Role |
|--------|------|
| `initCodexTables` | One-shot DDL for the canonical schema |
| `read` | Query namespace (`recall`, `getBeliefDetail`, `listFlags`, …) |
| `write` | Mutation namespace (`remember`, `confirmBelief`, `correctBelief`, …) |
| `types` | Shared TypeScript types and enums |
| `errors` | Error classes and `isCodexError` guard |
| `CodexDb` | Type alias for the database interface |
| `resolveNow`, `withTransaction` | Plumbing hooks for time and transactions |

Root re-exports also surface concrete error classes without the `errors.`
prefix.

## Minimal Session

```ts
import { DatabaseSync } from 'node:sqlite';
import { initCodexTables, read, write } from '@ghostpaw/codex';

const db = new DatabaseSync(':memory:');
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');
initCodexTables(db);

// Capture a belief
const belief = write.remember(db, {
  claim: 'TypeScript improves maintainability',
  source: 'explicit',
  category: 'fact',
});

// Recall by topic
const results = read.recall(db, 'TypeScript benefits');

// Confirm when seen again
write.confirmBelief(db, belief.id);

// Inspect in detail
const detail = read.getBeliefDetail(db, belief.id);

// Check what needs attention
const flags = read.listFlags(db);
```

## The Human Modeling Rule

Codex works best when a human keeps its epistemic boundaries clean:

1. Put one testable proposition per belief. Split compound claims.
2. Choose the honest source: `explicit` if stated, `observed` if seen,
   `distilled` if extracted, `inferred` if concluded.
3. Choose the narrowest category: `preference`, `fact`, `procedure`,
   `capability`, or `custom`.
4. Do not inflate certainty. Let the source-weighted default start the belief
   honestly.
5. Use provenance to record where the information came from.

If those boundaries blur — compound claims, inflated sources, wrong categories —
every downstream surface (recall, flags, status, trends) works against
distorted data.

## Core Human Boundaries

### Belief vs. Note

A belief is one assertable proposition with confidence metadata: "The API uses
GraphQL", not "Meeting notes from March 14." If you want to preserve meeting
content, that is a journal or transcript. Codex stores what you *believe*, not
what you *heard*.

### Active vs. Superseded vs. Deleted

- **Active**: currently held and retrievable through recall.
- **Superseded**: replaced by a successor. Still visible in lineage for audit
  and reflection, but exits active recall.
- **Deleted**: no trace remains. Reserved for privacy and hard erasure.

Use `correctBelief` to supersede. Use `forgetBelief` to exit active recall
while preserving the audit trail. Use `deleteBelief` only for hard erasure.

### Source vs. Category

Source answers: how do I know this? Category answers: what kind of claim is
this? "The user prefers dark mode" is source `explicit` (they told me) and
category `preference` (it is a taste). "The API probably supports pagination"
is source `inferred` (I concluded it) and category `capability` (it is about
what something can do). Keep these separate.

### Certainty vs. Evidence

Certainty is confidence in the claim right now (0 to 1). Evidence is how many
times the belief has been confirmed. A single strong confirmation can set high
certainty. Many weak confirmations accumulate evidence. Both affect recall
scoring and flag priority differently.

## The Read Surface

All queries are deterministic, require no LLM, and carry transparency metadata.

| Function | Returns |
|----------|---------|
| `read.recall(db, query, options?)` | Ranked active beliefs by semantic + lexical match |
| `read.getBeliefDetail(db, beliefId)` | One belief with certainty, freshness, strength, lineage depth, proximity, version diff |
| `read.getBeliefLineage(db, beliefId)` | Full chain of predecessors and successors |
| `read.listFlags(db, now?)` | Beliefs needing attention with reason codes and priority scores |
| `read.getStatus(db, now?)` | Portfolio state: integrity, distributions, averages |
| `read.listLog(db, limit?)` | Recent activity: remembers, confirms, revisions, forgets, merges |
| `read.getTrends(db)` | Growing categories, calibration alerts, revision patterns |
| `read.listBeliefProximity(db, beliefId)` | Active beliefs semantically near a given belief |

### Recall options

```ts
read.recall(db, 'deployment process', {
  limit: 10,
  minScore: 0.1,
  category: 'procedure',
  source: 'explicit',
});
```

Category and source filters narrow the candidate set before scoring. The
`minScore` threshold controls the quality cutoff.

## The Write Surface

Every write returns the mutated record with derived state already computed.

| Function | What it does |
|----------|--------------|
| `write.remember(db, input, options?)` | Create a new belief. Returns the belief plus proximity matches. |
| `write.confirmBelief(db, beliefId, options?)` | Reinforce an existing belief. Certainty rises via EMA, evidence increments, `verifiedAt` refreshes. |
| `write.correctBelief(db, beliefId, input, options?)` | Create a successor belief and supersede the old one. Returns the new belief, the superseded id, and proximity. |
| `write.mergeBeliefs(db, input, options?)` | Consolidate multiple beliefs into one richer successor. |
| `write.forgetBelief(db, beliefId, options?)` | Supersede a belief out of active recall. Audit trail preserved. Optional `successorId` for directed supersession. |
| `write.deleteBelief(db, beliefId)` | Permanently destroy a belief and its lineage chain. No trace remains. |
| `write.deferBelief(db, beliefId, deferredUntil, options?)` | Postpone flag eligibility until a future timestamp. No other state changes. |
| `write.dismissProximityPair(db, beliefA, beliefB, options?)` | Record that two beliefs are not meaningfully related. Uses exponential backoff. |

### Remember input

```ts
write.remember(db, {
  claim: 'The billing API has a 5-second timeout',
  source: 'observed',
  category: 'fact',
  provenance: 'incident-2024-11',
});
```

The `certainty` field is optional — it defaults to the source-weighted value
(`explicit` = 0.9, `observed` = 0.8, `distilled` = 0.6, `inferred` = 0.5).
Only override it when you have a specific reason.

### Correct input

```ts
write.correctBelief(db, oldBeliefId, {
  claim: 'The billing API has a 10-second timeout',
  source: 'observed',
  certainty: 0.85,
});
```

The replacement can change the claim, source, category, and certainty. The old
belief is superseded. Lineage records what changed and when.

### Merge input

```ts
write.mergeBeliefs(db, {
  beliefIds: [12, 34],
  claim: 'SQLite supports databases up to 281TB with WAL mode for concurrent reads',
});
```

When called with a `successorId` instead of a new claim, the existing belief
becomes the winner and the others are superseded to it.

### Forget with directed supersession

```ts
write.forgetBelief(db, weakerBeliefId, {
  successorId: strongerBeliefId,
});
```

This is how you express "belief A already covers belief B" without creating a
new entry.

## Human Operating Loop

The direct-code operating loop is:

1. **Capture** beliefs as they arise — one claim per belief, honest source.
2. **Search before creating** to avoid duplicates — `read.recall()` first.
3. **Confirm** beliefs when evidence accumulates — `write.confirmBelief()`.
4. **Correct** beliefs when understanding changes — `write.correctBelief()`.
5. **Process flags** periodically — `read.listFlags()` drives the maintenance
   queue.
6. **Inspect** before acting — `read.getBeliefDetail()` gives full context.
7. **Check status** to monitor health — `read.getStatus()` shows integrity.
8. **Review trends** for systemic patterns — `read.getTrends()` catches
   calibration drift.

## 1. Capture Beliefs Honestly

When new information arrives, decide whether it is a belief worth storing.

Split compound claims: "The API uses REST and requires VPN access" becomes two
separate beliefs, each independently confirmable.

Choose the strongest honest source:

| Source | When to use |
|--------|------------|
| `explicit` | The person directly stated this |
| `observed` | You saw this behavior or evidence |
| `distilled` | You extracted this from a conversation, document, or session |
| `inferred` | You concluded this from indirect evidence |

```ts
write.remember(db, {
  claim: 'The frontend will use React',
  source: 'explicit',
  category: 'fact',
  provenance: 'kickoff-meeting-2025-03',
});
```

Human habit:

- one claim per belief
- honest source
- use provenance to record where it came from
- do not inflate certainty

## 2. Search Before Creating

Before adding a new belief, check whether it already exists:

```ts
const existing = read.recall(db, 'frontend framework', { minScore: 0 });
```

If a match exists: confirm it (same meaning) or correct it (updated meaning).
Do not create a duplicate.

```ts
// Same meaning — reinforce
write.confirmBelief(db, existingBeliefId);

// Updated meaning — supersede
write.correctBelief(db, existingBeliefId, {
  claim: 'The frontend will use Svelte',
});
```

The `remember` function returns proximity matches in the result. If
`result.proximity` is non-empty, inspect the matches before moving on.

## 3. Confirm When Evidence Accumulates

Each confirmation strengthens the belief through exponential moving average:

```ts
write.confirmBelief(db, beliefId);
```

Certainty rises toward the ceiling (`0.99`). Evidence increments. `verifiedAt`
refreshes, resetting the freshness clock. A belief confirmed 4 times decays at
half the rate. A belief confirmed 16 times decays at a quarter the rate.

Human habit:

- confirm when you see the same evidence again
- do not confirm automatically just to boost certainty
- each confirmation should represent a genuine re-observation

## 4. Correct When Understanding Changes

When the claim is no longer accurate, correct rather than delete:

```ts
write.correctBelief(db, oldBeliefId, {
  claim: 'The team deploys on Thursdays, not Fridays',
  source: 'observed',
});
```

The old belief is superseded. The new belief enters with fresh certainty. The
lineage chain records what was believed before and when it changed. The version
diff is available through `read.getBeliefDetail()`.

Human habit:

- prefer correct over delete
- correct preserves the epistemic record
- delete destroys it

## 5. Process Flags Periodically

Flags are the maintenance surface. They tell you what needs attention and why.

```ts
const flags = read.listFlags(db);
```

Each flag carries reason codes and a review priority. The reason codes tell you
*why* the belief surfaced:

| Code | Meaning | Typical action |
|------|---------|---------------|
| `stale` | Freshness below threshold | Confirm if still valid, correct if changed, forget if irrelevant |
| `fading` | Freshness declining | Same as stale, but less urgent |
| `single_evidence` | Only confirmed once | Confirm with genuine re-observation or defer |
| `unstable` | Lineage depth exceeds threshold | Inspect why it was revised so often |
| `low_trust` | Source is inferred or distilled | Confirm with stronger evidence |
| `gap` | Category underrepresented | Consider capturing beliefs in the thin category |

Flags respect `deferredUntil` — deferred beliefs do not appear until their
deferral expires.

Human habit:

- process flags weekly
- inspect before acting — `read.getBeliefDetail()` first
- choose the right verb for the situation
- do not blanket-confirm to clear the queue

## 6. Inspect Before Acting

Before revising a belief, get full context:

```ts
const detail = read.getBeliefDetail(db, beliefId);
```

This returns:

- certainty, freshness, strength tier, evidence count
- source, category, provenance
- lineage depth
- proximity matches (nearby active beliefs)
- version diff (if superseded or superseding)

Proximity matches are the overlap detection surface. If a nearby belief is a
genuine duplicate, merge or forget one. If the pair is genuinely distinct,
dismiss it:

```ts
write.dismissProximityPair(db, beliefA, beliefB);
```

## 7. Monitor Health

```ts
const status = read.getStatus(db);
```

Key fields:

- `integrity` — percentage of active beliefs in the Strong tier. Above 70% is
  healthy. Below 50% needs immediate attention.
- `strengthCounts` — how many beliefs are strong, fading, or faint.
- `certaintyDistribution` — spread of confidence levels.
- `evidenceDistribution` — how well-confirmed the portfolio is.
- `sourceCounts` — balance between explicit, observed, distilled, and inferred.
- `categoryCounts` — balance across preference, fact, procedure, capability,
  custom.

Human habit:

- check status after maintenance passes
- watch for declining integrity as a signal that flags are accumulating
- watch for imbalanced source counts as a signal that too many beliefs are
  inferred

## 8. Review Trends

```ts
const trends = read.getTrends(db);
```

Key fields:

- `growingCategories` — which categories are gaining beliefs fastest.
- `calibrationAlerts` — warnings when high-certainty beliefs are frequently
  revised, signaling systematic overconfidence.
- `revisedHighCertaintyCount` — how many confident beliefs were corrected.
- `repeatedlyRevisedCount` — how many beliefs have unstable revision history.

If calibration alerts appear repeatedly, lower your default certainty for the
problematic source or category combination.

## Verbs At A Glance

| Verb | Function | When to use |
|------|----------|-------------|
| Remember | `write.remember()` | New proposition enters the Codex |
| Confirm | `write.confirmBelief()` | Same evidence seen again |
| Correct | `write.correctBelief()` | Understanding changed — supersede with replacement |
| Merge | `write.mergeBeliefs()` | Two beliefs consolidate into a richer successor |
| Forget | `write.forgetBelief()` | Belief exits active recall — audit trail preserved |
| Delete | `write.deleteBelief()` | Hard erasure — no trace remains |
| Defer | `write.deferBelief()` | Postpone flag eligibility until a future date |
| Dismiss | `write.dismissProximityPair()` | Suppress a false-positive proximity pair |

## What Good Usage Looks Like

Good usage:

- one claim per belief, honestly sourced
- search before creating to avoid duplicates
- correct and confirm regularly to keep the active set honest
- process flags before they accumulate
- use lineage as a growth record, not a failure trail
- check status and trends for systemic health

Bad usage:

- compound claims bundled into single beliefs
- inflated sources to boost certainty artificially
- blanket-confirming flags without genuine re-evaluation
- deleting beliefs instead of correcting to avoid lineage
- ignoring proximity warnings after captures
- never processing flags

## Where To Go Next

- Use [`entities/`](entities/) for detailed entity descriptions.
- Use [`README.md`](README.md) for architecture and mechanics.
- Use [`LLM.md`](LLM.md) when building a harness around `soul`, `tools`, and
  `skills`.
