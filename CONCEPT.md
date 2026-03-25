# Codex

Codex is a standalone belief engine. It stores claims with certainty, evidence,
provenance, decay, and revision lineage. It is not a journal, a transcript
archive, or a flat memory list. It is the system for what is currently believed,
how strongly, why, and how that understanding has changed over time.

`questlog` is about commitments in time. `affinity` is about people and
relationships. `codex` is about belief.

The point is not to remember more. The point is to know better.

## The Belief Atom

A belief is one claim plus the minimum metadata needed to rank, revise, and
maintain it.

| Field           | Type              | Meaning                                           |
| --------------- | ----------------- | ------------------------------------------------- |
| `claim`         | text              | the asserted proposition                          |
| `certainty`     | real 0..1         | current confidence in the claim                   |
| `evidence`      | integer           | how many confirmations support it                 |
| `source`        | enum              | where the belief came from                        |
| `category`      | enum              | what kind of claim it is                          |
| `createdAt`     | timestamp         | when it entered the codex                         |
| `verifiedAt`    | timestamp         | when it was last reinforced or revised            |
| `supersededBy`  | id or null        | the successor belief in lineage, if any           |
| `provenance`    | text or null      | optional origin reference (session, URL, context) |
| `deferredUntil` | timestamp or null | excluded from Flags until this time passes        |

One belief carries one proposition. Compound claims ("the API uses REST and
requires VPN access") are split into separate beliefs so each can be confirmed,
corrected, or forgotten independently.

Codex has no opinion about whether a belief is true. It tracks what is believed
and how strongly, not what corresponds to reality. A belief that is objectively
wrong sits in the Codex without the system flagging it as an error. Only
heuristic suspicion and review can surface it for human or agent attention. An
engine that claimed to verify truth would be either trivial or dishonest.

## Grammar

| Concept             | Name        | Notes                                          |
| ------------------- | ----------- | ---------------------------------------------- |
| system              | `Codex`     | sci-fi native; structured, indexed, persistent |
| core unit           | `Belief`    | scientifically correct atom                    |
| belief text         | `Claim`     | what the belief asserts                        |
| confidence          | `Certainty` | 0..1 value                                     |
| evidence count      | `Evidence`  | confirmation counter                           |
| source              | `Source`    | provenance enum                                |
| category            | `Category`  | type classification                            |
| retrieval           | `Recall`    | ranked search                                  |
| single inspection   | `Detail`    | one belief fully expanded                      |
| maintenance surface | `Flags`     | beliefs needing attention, with reason codes   |
| portfolio view      | `Status`    | overall Codex state                            |
| activity feed       | `Log`       | recent changes                                 |
| projections         | `Trends`    | time-based patterns                            |
| revision chain      | `Lineage`   | full history of a belief's evolution           |
| update umbrella     | `Revision`  | any correction, merge, or confirm              |
| overall score       | `Integrity` | % of active beliefs in Strong tier             |
| strong tier         | `Strong`    | high certainty, reliable                       |
| fading tier         | `Fading`    | weakening, needs attention                     |
| faint tier          | `Faint`     | barely detectable                              |

### Verbs

- `Remember` — create a new belief
- `Recall` — retrieve ranked active beliefs
- `Confirm` — reinforce an existing belief
- `Correct` — supersede a belief with a better one
- `Merge` — consolidate related beliefs into a richer successor; optionally
  accepts a `successor` reference to nominate an existing belief as the winner
  instead of creating a new one
- `Forget` — supersede out of active recall; audit trail preserved; optionally
  accepts a `successor` reference to direct supersession to a specific existing
  active belief instead of self
- `Delete` — destroy a belief and its lineage chain; no trace remains
- `Defer` — postpone a belief's next flag eligibility to a specific time; sets
  `deferredUntil`, no other state changes

Forget is epistemic. Delete is administrative. Defer is temporal. All three are
needed: Forget for normal revision, Delete for privacy and hard erasure, Defer
for "the math says due, but I'm not ready."

The `successor` parameter on Forget and Merge enables directed supersession
between existing beliefs. Without it, there is no way to express "belief A
already exists and replaces belief B" — Correct always creates a new successor,
and bare Forget points to self. The parameter must reference an active belief
(`supersededBy IS NULL` on the target).

Forbidden system nouns: Journal, Chronicle, Archive, Lore, Grimoire, Memory
Palace, Ledger, Library. Each misses the center of gravity.

## Sources And Trust Asymmetry

| Source      | Initial Certainty | Meaning                                  |
| ----------- | ----------------- | ---------------------------------------- |
| `explicit`  | 0.9               | the user or agent directly stated this   |
| `observed`  | 0.8               | inferred from observed behavior          |
| `distilled` | 0.6               | extracted from a conversation or session |
| `inferred`  | 0.5               | concluded from indirect evidence         |

This encodes a trust hierarchy grounded in evidence-quality research. What was
personally stated starts strongest. What was inferred starts weakest. Both can
change through later evidence, but the starting position reflects real
epistemological weight.

The trust asymmetry has operational consequences. Lower-source beliefs enter
with less certainty and are more likely to surface through `low_trust` flagging
until later evidence strengthens them. The source enum is the tension resolver
between high-volume automated agent writes and deliberate human captures.

Source also serves as the interface contract between Codex and other systems.
Explicit means the user told me. Observed means behavior was seen. Distilled
means extracted from a session. Inferred means concluded from evidence. Every
system that deposits beliefs into Codex picks a source, and that source shapes
how the belief is treated for its entire lifetime.

## Categories

| Category     | Covers                             |
| ------------ | ---------------------------------- |
| `preference` | tastes, settings, personal choices |
| `fact`       | world knowledge, stable truths     |
| `procedure`  | how to do something                |
| `capability` | what something can or cannot do    |
| `custom`     | anything else                      |

Categories are type classifications: what kind of claim a belief is. They are
not topic classifications: what the claim is about. "Alex prefers TypeScript" is
type `preference`, but the topic (Alex, TypeScript) is not captured in the
category. Topic matching is handled by semantic recall at query time.

This is a conscious trade-off. It keeps the stored metadata lean and avoids the
slippery slope of tags, tag hierarchies, and tag management. Semantic recall
compensates. When embeddings are unavailable, FTS keyword matching provides
topic filtering at lower precision.

## Core Mechanics

### Source-Weighted Entry

New beliefs enter with initial certainty determined by source. See the Sources
table above. The entry formula clamps to `[0.1, maxCertainty]` and sets
`evidence = 1`, `verifiedAt = now`.

### Reinforcement

Confirmation strengthens a belief gradually through an exponential moving
average with a ceiling.

```text
newCertainty = min(maxCertainty, alpha * 1.0 + (1 - alpha) * oldCertainty)
```

Defaults: `alpha = 0.3`, `maxCertainty = 0.99`.

Each confirmation increments `evidence` and refreshes `verifiedAt`. Repetition
matters, but no belief becomes perfectly unquestionable.

### Forgetting Curve

Freshness decays continuously with time and is slowed by repeated evidence.

```text
freshness = exp(-ageDays / (halfLifeDays * sqrt(evidence)))
```

Default: `halfLifeDays = 90`.

Four confirmations slow decay by 2x. Sixteen slow it by 4x. This creates
meaningful resistance to decay without allowing belief immortality through
spam.

### Revision

A changed belief creates lineage, not erasure.

- `Confirm` reinforces the active belief. Certainty rises via EMA. Evidence
  increments. `verifiedAt` refreshes.
- `Correct` creates a successor belief and sets `supersededBy` on the old one.
  The old claim remains in lineage.
- `Merge` consolidates multiple beliefs into one richer successor. All merged
  beliefs point their `supersededBy` to the new one. When called with a
  `successor` reference, the existing belief becomes the winner — no new belief
  is created, all others are superseded to it.
- `Forget` supersedes a belief out of active recall. The audit trail is
  preserved. The belief still exists in lineage. When called with a `successor`
  reference, `supersededBy` points to that belief instead of self.
- `Delete` destroys a belief and its lineage chain. No trace remains. This is
  for privacy and hard erasure, not normal revision.
- `Defer` sets `deferredUntil` on a belief. Until that timestamp passes, the
  belief is excluded from Flags. Once it passes, normal flag eligibility
  resumes automatically. No other state changes. The forgetting curve already
  schedules passive resurfacing through `verifiedAt` and freshness decay —
  Defer is the human override for when the math says "due" but the human says
  "not yet."

### Hybrid Recall

Recall combines semantic relevance with epistemic weight.

1. Pre-rank active beliefs by recall score (see Scoring Split below).
2. Score semantic similarity (cosine on embeddings) on the reduced candidate
   set.
3. Fall back to FTS5 text search when semantic results are weak or embeddings
   are unavailable.

This avoids both transcript reload and purely lexical search.

### Proximity

Proximity answers a different question than recall: not "what matches this
query?" but "what is near this belief?" The engine computes similarity between
a given belief and all other active beliefs using the same embedding cosine
similarity used for recall. Computed at query time, never stored.

The read function returns the top `proximityK` active beliefs above
`proximityThreshold` similarity. It excludes self, superseded beliefs, and pairs
currently in dismissal backoff.

When embeddings are unavailable, proximity falls back to FTS keyword overlap.
Lower precision, more false positives. The mechanism is identical; only the
signal quality degrades.

When two beliefs are compared and found unrelated, the app records the dismissal.
Dismissed pairs use exponential backoff:

```text
resurfaceAfter = now + min(dismissBackoffMax, dismissBackoffDays * 2^dismissCount) * MS_PER_DAY
```

Pairs whose `resurfaceAfter` has not passed are excluded from proximity results.
Dead dismissal rows — where either belief has been superseded — are harmless.
Superseded beliefs never appear in active proximity computation, so old rows are
never rechecked. No cleanup needed.

One support table tracks dismissed pairs:

```text
dismissals(
  belief_a         INTEGER,  -- canonical: min(a, b)
  belief_b         INTEGER,  -- canonical: max(a, b)
  dismiss_count    INTEGER DEFAULT 0,
  resurface_after  INTEGER,
  PRIMARY KEY (belief_a, belief_b)
)
```

Proximity is not a flag. It does not label anything as a conflict. The engine
detects topical nearness; the human judges whether nearness means conflict,
duplication, or coincidence. This separation keeps flags purely about individual
belief health (O(1) per belief) and moves inter-belief relationship awareness to
a lazy, on-demand read path.

## The Scoring Split

The single most important design decision in Codex. Recall and review serve
different purposes and use different scoring functions over the same stored
data.

### The Problem

A naive formula like `certainty * freshness` penalizes stable facts and
maintenance-worthy beliefs equally. A fact confirmed ten times but untouched for
a year gets the same low score whether you are asking "what do I know about X?"
(recall) or "what needs my attention?" (review). These are fundamentally
different questions.

### Recall Scoring

Recall answers: what is most relevant and trustworthy?

Well-confirmed beliefs resist freshness decay through an evidence floor.

```text
evidenceFloor = 1 - exp(-evidence / evidenceFloorK)
recallWeight  = certainty * max(freshness, evidenceFloor)
recallScore   = recallWeight * cosineSimilarity
```

Default: `evidenceFloorK = 5`.

Effect: a belief confirmed 10 times has an evidence floor of ~0.86 and never
drops below that in recall weight regardless of age. "My name is Alex" stays
retrievable forever once confirmed a few times. Single-evidence beliefs still
decay normally.

### Review Scoring

Review answers: what needs attention?

Stale and under-verified beliefs surface through inverted freshness weighted by
maintenance reason.

```text
reviewPriority = (1 - freshness) * reasonWeight
```

Flag reason codes and their weights:

| Flag              | Weight | Triggers when                               |
| ----------------- | ------ | ------------------------------------------- |
| `stale`           | 1.0    | freshness below fading threshold            |
| `fading`          | 0.8    | freshness declining but not yet stale       |
| `single_evidence` | 0.7    | evidence count is 1                         |
| `unstable`        | 0.9    | lineage depth exceeds threshold             |
| `low_trust`       | 0.6    | source is inferred or distilled             |
| `gap`             | 0.5    | category underrepresented in active beliefs |

Inter-belief overlap is not a flag. Flags are individual belief health metrics,
all O(1) per belief. Overlap detection lives in the proximity read path — lazy,
on-demand, per-belief — and surfaces through Detail enrichment rather than flag
codes. Contradictions between healthy beliefs are caught through recall results
(both rank high for same-topic queries) and through eventual decay (the staler
one gets flagged, its proximity reveals the newer one).

Multiple flags stack additively, capped at a maximum.

Effect: old untouched beliefs get flagged, but only when they carry
maintenance-worthy reasons. A stable well-confirmed fact gets flagged
occasionally (for periodic verification) but never dominates.

### Why Two Functions

Two scoring functions, zero schema cost. The stored truth is identical. The
behavioral difference is profound: recall stays useful for stable knowledge
while flags concentrate attention on the beliefs that actually need it. This
prevents the most common user complaint in belief systems: "I told you this and
you forgot."

## Derived State

All derived state is computed at query time, never stored.

- `freshness` — from time elapsed and evidence inertia
- `strength` — tier label: `Strong` (certainty >= 0.7), `Fading` (>= 0.4),
  `Faint` (below 0.4)
- `integrity` — percentage of active beliefs in Strong tier; the Codex's overall
  score. Rises with maintenance, falls with neglect.
- `recallScore` — from recall scoring function
- `reviewPriority` — from review scoring function (drives flags)
- `versionDiff` — before/after claim pair on any revision, derived from lineage
- `proximity` — similar active beliefs above threshold; computed at query time
  from embedding similarity or FTS keyword overlap
- `calibrationFeedback` — pattern detection: if high-certainty beliefs are
  frequently revised, trends flags it as a calibration signal

## Surfaces

The read model set. Each surface is deterministic, requires no LLM, and carries
transparency metadata: `reasonCodes`, `scoreParts`, `lastChangedAt`,
`lineageDepth`.

| Surface  | Returns                                                                                                     |
| -------- | ----------------------------------------------------------------------------------------------------------- |
| `Recall` | ranked active beliefs for a query                                                                           |
| `Detail` | one belief with certainty, freshness, source, category, lineage, provenance, proximity                      |
| `Flags`  | beliefs needing attention with flag codes and priority scores; respects `deferredUntil`                     |
| `Status` | portfolio state: certainty distribution, evidence distribution, source balance, category balance, integrity |
| `Log`    | recent additions, confirmations, and revisions                                                              |
| `Trends` | time-based projections: growing categories, repeated instability, calibration feedback                      |

Flags excludes beliefs where `deferredUntil > now`. It does not pre-compute
proximity — the app loads proximity lazily for the belief currently being
reviewed, via Detail or a standalone proximity query.

A human or agent knows _why_ something surfaced without needing a second LLM
pass to explain the first system's behavior.

A typical HUD readout: `Codex integrity: 82%. 47 beliefs held. 5 flags
pending.`

## Product Surfaces

Codex is infrastructure when used as a library and a product when surfaced
through a UI. The engine provides proximity, dismissal backoff, flag filtering,
and directed supersession. The product layer provides card layout, button
labels, visual diff highlighting, queue flow, and interaction choreography.
Lineage is not only a maintenance record but a growth timeline — the product
can surface a belief's evolution as a positive discovery rather than a repair
task. The same engine serves all of the following scenarios without case-specific
logic in the core.

### Agent Memory Engine

An LLM agent stores beliefs extracted from conversations. Source is `distilled`
or `inferred`. The agent recalls beliefs during tool execution to avoid
redundant questions and maintain continuity. A warden process checks flags
periodically, confirming still-valid beliefs and correcting stale ones.

Workflow: conversation produces candidate claims. Agent calls `remember` with
appropriate source. The warden checks proximity after each remember to catch
duplicates and uses `forget(old, { successor: new })` for directed supersession
when overlap is found. Later conversations call `recall` to retrieve relevant
beliefs. Flags surface beliefs that have gone stale or have low evidence. The
warden confirms, corrects, or forgets in batch. Status and integrity track
overall Codex state.

Key primitives: source-weighted entry, recall scoring with evidence floor,
flags, hybrid recall, proximity for deduplication, directed supersession,
integrity as maintenance signal.

### Personal Belief Tracker

A human captures beliefs about decisions, assumptions, preferences, and
understanding. The Codex lives as a single SQLite file, portable between
devices. The human processes flags weekly, corrects stale understanding, and
inspects how their beliefs have changed over time.

Workflow: open the Codex and capture a belief ("I believe remote work improves
my productivity", source explicit, category preference). Later, check flags. It
surfaces beliefs that are fading, weakly supported, or unstable. Confirm the
ones that still hold. Correct the ones that have changed. Forget the ones that
no longer matter. Defer the ones you cannot judge yet. Inspect lineage for any
belief to see how your understanding evolved over time. Watch integrity rise as
you maintain the Codex.

Key primitives: manual remember, flags with reason codes, defer for deferred
judgment, lineage as growth timeline, version diff, integrity as progress
indicator, portability as a single SQLite file.

### Configuration And Preferences Store

An application stores user preferences as beliefs. "User prefers dark mode"
enters as source `explicit`, category `preference`, certainty 0.9. Preferences
that go unconfirmed for months naturally fade through the forgetting curve.
Active preferences rank high in category-filtered recall. The application reads
current preferences without managing expiration logic itself.

Workflow: app calls `remember` for each preference. App calls `recall` with
category filter `preference` to retrieve current preferences ranked by
certainty. Unused preferences naturally decay. User corrections create lineage
so preference history is preserved.

Key primitives: category filtering, freshness decay as natural expiration,
certainty ranking, recall scoring with evidence floor for stable preferences.

### Decision Support Journal

A human freezes reasoning before outcomes arrive. "I believe deploying on Friday
is safe, certainty 0.8." Weeks later, the human reviews what they believed at
decision time versus what they believe now. Lineage shows the revision trail.
Version diffs show before/after pairs. Trends flags calibration issues: if your
high-certainty beliefs are frequently revised, your calibration needs
adjustment.

Workflow: before a decision, capture the key beliefs with honest certainty
estimates. After the outcome, check flags for those beliefs. Confirm the ones
that held. Correct the ones that didn't. Defer beliefs whose outcomes have not
yet arrived. Inspect the version diff. Over time, check calibration feedback in
trends to see whether your certainty estimates are reliable.

Key primitives: timestamped capture with certainty, lineage, version diff,
defer for outcome-dependent beliefs, calibration feedback in trends, flags.

### Project Assumption Tracker

A team lead captures project assumptions. "The API supports pagination", source
`inferred`, category `capability`. As evidence arrives, assumptions are
confirmed or corrected. Status shows which assumption categories are thin or
repeatedly changing. Flags surface assumptions that have gone unverified.

Workflow: at project start, capture key assumptions with appropriate source and
category. As the project progresses, confirm assumptions that prove correct and
correct ones that don't. Check status to see which categories have weak evidence
or high revision rates. Process flags to catch assumptions that have gone stale
without verification. Track integrity to monitor overall assumption quality.

Key primitives: source-weighted entry, confirm/correct cycle, category-filtered
status views, flags with `single_evidence` and `stale` codes.

## Two Quality Levels

Codex operates at two quality levels depending on whether embeddings are
available.

**With embeddings:** full hybrid recall and semantic proximity. Vector
pre-ranking, cosine similarity scoring, FTS5 fallback. This is the
highest-quality retrieval and proximity path and requires an embedding provider.

**Without embeddings:** FTS-only recall and lexical proximity. Keyword and
phrase matching on claim text. Lower precision for semantic queries and proximity
detection but fully functional for exact and near-exact matches.

Everything else works identically at both levels: capture, confirm, correct,
merge, forget, delete, defer, flags, status, trends, lineage, version diff,
dismissal backoff. The non-LLM human experience is not degraded. Semantic recall
and proximity are bonuses, not requirements. The forgetting curve catches what
proximity misses.

## Scientific Grounding

Every mechanism traces to established science. See `RESEARCH.md` for the full
isolated research findings and one-sentence judgments.

| Science                                                       | Codex Mechanism                                                       |
| ------------------------------------------------------------- | --------------------------------------------------------------------- |
| confidence calibration is a structural control signal         | `certainty` as first-class state shaping recall, review, and language |
| selective forgetting improves quality                         | `freshness` decay drives flags, not background deletion               |
| revision lineage enables learnability and auditability        | `supersededBy` chain preserves full revision history                  |
| provenance improves trust and correction quality              | `provenance` field and `source` enum on every belief                  |
| contradiction needs discipline, not premature resolution      | proximity surfaces overlap for human judgment, not auto-resolved      |
| resurfacing creates value when score-based, not cadence-based | flag priority from scoring, not rigid schedules                       |
| hindsight distorts memory                                     | timestamped beliefs and version diffs anchor what was believed when   |
| confidence-weighted beliefs outperform flat fact lists        | recall scoring combines certainty, evidence, and similarity           |
| portable self-model is compelling for agents and humans       | single SQLite file, lean schema, trivially exportable                 |
| local-first storage is a trust foundation                     | no cloud dependency, intimate data stays on device                    |

### Guardrails

- No flat append-only truth store. Old claims weaken through freshness decay.
- No binary remembered/forgotten worldview. Beliefs carry degrees of certainty.
- No destructive overwrite as default. Revision creates lineage.
- No absolute certainty. `maxCertainty = 0.99` is a hard ceiling.
- No transcript reload disguised as memory. Retrieval is selective and ranked.
- No metaphor implying objective lore. Beliefs can be wrong, stale, or
  incomplete.

## Automation Boundary

### Deterministic

Never requires an LLM:

- storing, confirming, correcting, merging, forgetting, deleting, deferring beliefs
- computing certainty, freshness, strength, integrity, recall scores, flag priority
- ranking recall results
- generating flags with reason codes
- generating status, trends, and calibration feedback
- surfacing lineage, version diffs, and revision depth
- recording pair dismissals and computing dismissal backoff

### Heuristic But Non-LLM

Mechanical approximations:

- proximity computation (embedding or FTS similarity above threshold)
- dismissal backoff with exponential decay
- provenance-aware trust penalties
- evidence-quality and review-priority scoring
- contextual resurfacing and stale-belief selection

### LLM-Required

Irreducibly semantic operations:

- extracting candidate beliefs from messy raw conversation
- deciding whether ambiguous statements are new beliefs, corrections, or noise
- resolving subtle semantic contradictions
- writing merged or corrected replacement claims when simple rules are unsafe

## Composability

Codex is the epistemic inbox of the architecture. Questlog produces learnings.
Affinity produces social observations. Skills produce procedural understanding.
All deposit into Codex. It is not just one of three faculties — it is the
convergence layer where understanding from every domain accumulates, gets
scored, and gets maintained.

The trinity covers a complete cognitive substrate:

| Faculty    | Domain                   | Core Loop                               |
| ---------- | ------------------------ | --------------------------------------- |
| `questlog` | tasks and commitments    | plan, track, complete, reward           |
| `affinity` | people and relationships | meet, bond, interact, maintain          |
| `codex`    | beliefs and knowledge    | remember, recall, revise, process flags |

Together they form a distributed graph. Task relationships, social links, and
belief lineage compose into graph-like capability without any single package
needing graph complexity internally. Each stays lean at the storage layer: one
primary table, with at most one small support table where the mechanics require
it. The composite provides genuine cognitive infrastructure.

No existing product does all three. The niche is empty.

## Operational Contracts

### Complexity Budget

- Prefer read models over new stored state.
- Prefer a few nullable fields over a large new subsystem.
- Allow at most one small support table unless proven necessary. The
  `dismissals` table (four columns, one row per dismissed pair) fills this slot.
  It grows slowly and shrinks passively — dead rows where either belief is
  superseded are never rechecked.
- Require correctness without background jobs.
- Reject changes that turn Codex into a graph platform, journal, CRM, or note
  app.
- Reject changes that only become valuable after large-scale saturation.

### Usage Regimes

**Cold start:** empty or tiny Codex. Manual capture dominates. Status, flags,
and integrity behave cleanly with zero beliefs.

**Sparse use:** occasional human review. Long gaps between confirmations. Flags
prioritize high-value beliefs rather than flooding the user.

**Steady use:** weekly review, frequent recall. Trends and category imbalances
become useful. Maintenance surfaces compound.

**Heavy use:** frequent agent writes and recalls. Provenance, trust, saturation
resistance, and flag prioritization matter most. Evidence floor in recall
scoring prevents confidence inflation from eroding stable knowledge.

### Defaults And Knobs

| Knob                 | Default | Controls                                          |
| -------------------- | ------- | ------------------------------------------------- |
| `halfLifeDays`       | 90      | forgetting curve decay rate                       |
| `confirmAlpha`       | 0.3     | EMA smoothing for reinforcement                   |
| `maxCertainty`       | 0.99    | ceiling on certainty                              |
| `recallK`            | 20      | number of recall results returned                 |
| `minScore`           | 0.1     | minimum recall score threshold                    |
| `evidenceFloorK`     | 5       | evidence floor curve steepness for recall scoring |
| `proximityThreshold` | 0.7     | minimum similarity for proximity surfacing        |
| `proximityK`         | 3       | max beliefs returned per proximity query          |
| `dismissBackoffDays` | 7       | initial backoff for dismissed pairs               |
| `dismissBackoffMax`  | 90      | maximum backoff in days                           |

Science ends as a few understandable defaults, not a wall of academic
parameters.

### Success Metrics

| Metric              | Measures                                                                  |
| ------------------- | ------------------------------------------------------------------------- |
| Token reduction     | how often deterministic recall and flags replace prompt-heavy memory      |
| Automation coverage | how much of Codex behavior runs without LLM intervention                  |
| Human value         | whether humans actually use recall, flags, correction, and trend surfaces |
| Trust quality       | whether stale, weak, or suspicious beliefs surface early enough to matter |
| Complexity cost     | how much schema and logic weight was added to get the value               |

Baselines: a plain notes app, a decision journal, and the current Ghostpaw
memory subsystem without Codex refinement.

## Standalone Scope

Codex owns belief storage and belief retrieval.

It does not own:

- relationships and social understanding (`affinity`)
- procedures and executable know-how (`skills`)
- identity or personality (`souls`)
- timelines, episodes, or narrative history (`trail`)
- tasks and temporal commitments (`questlog`)

### Integration Boundary

Codex is the belief engine. Orchestration policy (who may write beliefs, when
review happens, how beliefs enter context) is external. Ghostpaw's warden
ownership model is one such policy, not the definition of the faculty.

The faculty remains valid as a direct-code standalone system. The underlying
model does not depend on soul-specific language to make sense.

### Reintegration Note

When extracted as a dedicated standalone package, Ghostpaw consumes the package
directly instead of maintaining a parallel internal model. The intended path:

- use the standalone Codex read and write surface as the source of truth
- keep Ghostpaw-side wrappers thin and policy-oriented
- preserve runtime assumptions: Node 24+, built-in `node:sqlite`, lean
  local-first data model
- treat warden-exclusive operation as orchestration policy, not core ontology

## Showcase Layers

Codex ships as a public read/write surface. Two showcase layers demonstrate what
can be built on top: a human-facing demo app and an LLM-facing tool/soul kit.
Neither layer adds to the core. Both compose the same deterministic engine.

### Demo App — Belief Console

A local-first micro-app for epistemic upkeep. Not a note app, not a PKM graph,
not a journal. A personal belief maintenance console: capture what you believe,
check what has gone weak, see how your understanding changes.

The aesthetic is cyberpunk-clean. Dark, controlled background. Strong contrast.
Restrained accent color. Terminal/HUD cues. Precise typography. Spacious cards.
Subtle system-state indicators. More "personal epistemic console" than "RPG
inventory."

#### Screens

**Capture.** A single prominent input: "What do you believe?" Below it, light
metadata controls for source and category. Category is auto-suggested by keyword
heuristics (claim starts with "how to" suggests `procedure`, contains "prefer"
suggests `preference`). Certainty and provenance are available but hidden by
default.

As the user types, the app debounces and runs a proximity query against active
beliefs. When nothing matches, the field stays clean. When a close match
surfaces, the input transforms:

```text
┌─────────────────────────────────────────────┐
│ The API uses GraphQL                        │
├─────────────────────────────────────────────┤
│  ↳ You already hold:                       │
│    "The API uses REST"  ████████░░          │
│                                             │
│    [Update existing]  [Keep both]           │
└─────────────────────────────────────────────┘
```

"Update existing" calls `correct`. "Keep both" calls `remember`. If the match is
near-exact, the app offers `confirm` instead of creating a duplicate. The
capture field becomes a universal entry point — sometimes it remembers,
sometimes it reinforces, sometimes it corrects. The user just types what they
believe. The app figures out which verb to use.

**Flags.** The real home screen. Not a table — a card stack. Each card shows the
claim, why it surfaced (flag reason as a terse label), and immediate actions.

Cards are adaptive. A solo flag card (no high-similarity neighbors) shows simple
triage: Confirm / Correct / Forget / Defer. A comparison card (proximity found a
close neighbor) widens to show a side-by-side with word-level diff highlighting.
The words that differ are visually marked. The human eye catches the
disagreement instantly without semantic understanding. Actions shift to the
comparison set: "This replaces that" / "Same thing" / "Different" / "Later."

When two flagged beliefs are themselves close to each other, the app can offer to
show them as a pair. Topic clustering groups consecutive flag cards by proximity
so the user resolves related beliefs in flow rather than context-switching.

One decision at a time. No dense queue management. No spreadsheet feel.

**Detail.** Full inspection of one belief: claim, certainty, evidence, source,
category, freshness, provenance, lineage, proximity. This is where comparison
becomes elegant — nearby beliefs appear alongside with a visual diff.

Long press or hover on any card reveals a compact lineage timeline: the belief's
evolution as a short vertical stack of superseded claims with dates. Not the full
detail view — a quick glance that shows how understanding evolved.

**Log.** A recent activity feed of remembers, confirms, corrections, merges,
forgets, deletes, defers. Makes the Codex feel alive and inspectable.

**Status.** A compact portfolio console: integrity ring, belief count, source
mix, category balance, strength distribution, trend hints. Clean system monitor,
not analytics bloat.

#### Visual Behavior

**Strength as visual treatment.** Strong belief cards are crisp, full contrast.
Fading beliefs are visually faded — lower opacity, desaturated. Faint beliefs
are ghostly. The card appearance IS the status indicator.

**Integrity as ambient element.** A persistent thin ring or bar, always visible.
Updates after every action. Confirm a belief — the ring fills slightly. Beliefs
decay unattended — it depletes. Not gamification. Ambient consequence.

**Integrity pulse.** After every write action, a brief animation on the
integrity indicator. Subtle green flash on confirm/correct. Slight amber dim on
forget. Acknowledgment that the action mattered.

**Capture echo.** After a successful remember, a brief non-blocking toast:
"Held. Near 2 existing beliefs. Integrity: 83%." Then fades.

**Ghost preview on correct.** When the user taps Correct, the old claim appears
ghosted/struck-through above the edit field. Visual lineage in the moment of
revision.

#### Why It Works

The maintenance loop IS the usage loop. Capture flows into comparison. Flags
flow into triage. Every action builds the supersession tree invisibly. The user
never manages lineage directly — they make obvious decisions on cards, and the
engine writes the structure underneath. False positives in proximity cost one
tap to dismiss. Deferred judgment is a first-class action, not avoidance. And
lineage surfaces occasionally as a growth story — what you used to think, what
replaced it, how your certainty changed — turning maintenance into
self-reflection.

### LLM Layer — Tools, Skills, Soul

When wired back into Ghostpaw, a dedicated soul operates the Codex through thin
tool wrappers over the same public read/write surface. The exact tool set is
determined during implementation — the goal is the smallest number of tools that
cover all verbs and queries without redundancy. Tools map to public surface
functions, not internal mechanics.

Skills encode procedures as markdown: how to extract beliefs from conversation,
how to process a flags batch, how to run a calibration pass. Each skill
composes the available tools into a repeatable workflow the soul can follow
without ad-hoc reasoning about Codex internals.

The Codex soul is the epistemic warden — the keeper of what is believed. It
does not decide what is true. It decides what the Codex should hold, how
strongly, and when beliefs need revision. It reads flags, processes proximity,
builds the supersession tree through the same verbs the human demo app uses.
The difference is orchestration policy, not capability.
