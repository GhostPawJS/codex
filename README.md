# @ghostpaw/codex

[![npm](https://img.shields.io/npm/v/@ghostpaw/codex)](https://www.npmjs.com/package/@ghostpaw/codex)
[![node](https://img.shields.io/node/v/@ghostpaw/codex)](https://nodejs.org)
[![license](https://img.shields.io/npm/l/@ghostpaw/codex)](LICENSE)
[![dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Live Demo](https://img.shields.io/badge/demo-live-06d6a0?style=flat&logo=github)](https://ghostpawjs.github.io/codex)

A standalone belief and memory engine for Node.js, built on SQLite.

Codex treats claims, certainty, evidence, provenance, decay, revision lineage,
and semantic proximity as one coherent model instead of separate systems. It
ships as a single prebundled blob with zero runtime dependencies, designed for
two audiences at once: human developers working directly in code, and LLM agents
operating through a structured `soul` / `tools` / `skills` runtime.

## Install

```bash
npm install @ghostpaw/codex
```

Requires **Node.js 24+** (uses the built-in `node:sqlite` module).

## Quick Start

```ts
import { DatabaseSync } from 'node:sqlite';
import { initCodexTables, read, write } from '@ghostpaw/codex';

const db = new DatabaseSync(':memory:');
initCodexTables(db);

// Remember a belief with source and category
const result = write.remember(db, {
  claim: 'The API uses GraphQL with a REST fallback.',
  source: 'explicit',
  category: 'fact',
});

// Strengthen it with confirmation
write.confirmBelief(db, result.id);

// Recall beliefs by natural language query
const results = read.recall(db, 'graphql api');

// Revise when understanding changes
write.correctBelief(db, result.id, {
  claim: 'The API uses GraphQL exclusively — REST was retired.',
  source: 'observed',
  category: 'fact',
});

// Check overall portfolio health
const status = read.getStatus(db);
const flags = read.listFlags(db);
```

## The Model

Five concepts, strict separation of concerns:

| Concept | Purpose |
|---|---|
| **Belief** | A claim held with certainty, evidence, provenance, decay, and revision lineage |
| **Dismissal** | An explicit record that two semantically close beliefs are intentionally distinct |
| **Flag** | A derived attention signal — stale, fading, low-trust, single-evidence, or gap |
| **Proximity** | Semantic nearness between beliefs, detected automatically on write |
| **Lineage** | The revision chain from corrections and supersessions, with version diffs |

The model means each kind of truth has its own home:

| What it looks like | What it actually is |
|---|---|
| A fact, preference, or procedure | A Belief with a category |
| "I heard this from the team" | A Belief with source `explicit` |
| "The system seems to do this" | A Belief with source `observed` or `inferred` |
| "This belief was wrong, here's the update" | A correction: old belief superseded, new one created |
| "These two beliefs look similar but are different" | A Dismissal |
| "This belief is stale / fading / weakly evidenced" | A Flag, computed at read time |

State is derived, not toggled. Freshness decays over time, strength tiers are
computed from certainty and evidence, review priority is scored from multiple
signals, and flags surface attention-worthy beliefs — all calculated at read
time, never stored as status flags.

### Belief lifecycle at a glance

Every belief moves through a lifecycle driven by verbs, not status fields:

&nbsp;

> **Capture**
>
> | | | |
> |:---:|---|---|
> | $\color{Goldenrod}{\textsf{+}}$ | *The API uses GraphQL.* | `remember · explicit · fact` |
> | | &darr; &ensp; confirm, correct, or forget over time | |
>
> **Strengthening**
>
> | | | |
> |:---:|---|---|
> | $\color{LimeGreen}{\textsf{✓}}$ | *The API uses GraphQL.* | `confirmed · 2× evidence` |
> | $\color{LimeGreen}{\textsf{✓✓}}$ | *The API uses GraphQL.* | `confirmed · 5× evidence · strong` |
>
> **Revision**
>
> | | | |
> |:---:|---|---|
> | $\color{CornflowerBlue}{\textsf{↻}}$ | *The API uses GraphQL exclusively.* | `corrected · supersedes #1` |
> | $\color{Gray}{\textsf{⊘}}$ | *The API uses GraphQL.* | `superseded · replaced by #2` |
>
> **Attention signals**
>
> | | | |
> |:---:|---|---|
> | $\color{Goldenrod}{\textsf{⚑}}$ | *Team standup is at 9:30 AM.* | `stale · not confirmed in 90 days` |
> | $\color{Orange}{\textsf{⚑}}$ | *React is our framework.* | `fading · freshness below 50%` |
> | $\color{Red}{\textsf{⚑}}$ | *Users prefer email digests.* | `low trust · inferred · ≤ 60% certainty` |

&nbsp;

## Two Audiences

### Human developers

Use the `read` and `write` namespaces for direct-code access to every domain
operation:

```ts
import { read, write } from '@ghostpaw/codex';

write.remember(db, { claim: 'Ship weekly releases.', source: 'explicit', category: 'procedure' });
write.confirmBelief(db, beliefId);
write.correctBelief(db, beliefId, { claim: 'Ship biweekly releases.', source: 'explicit', category: 'procedure' });
write.forgetBelief(db, beliefId);

const flagged = read.listFlags(db);
const detail = read.getBeliefDetail(db, beliefId);
const lineage = read.getBeliefLineage(db, beliefId);
```

See [HUMAN.md](docs/HUMAN.md) for the full human-facing guide with worked
examples.

### LLM agents

Use the `tools`, `skills`, and `soul` namespaces for a structured runtime
surface designed to minimize LLM cognitive load:

```ts
import { tools, skills, soul } from '@ghostpaw/codex';

// 7 intent-shaped tools with JSON Schema inputs and structured results
const allTools = tools.codexTools;
const searchTool = tools.getCodexToolByName('search_codex')!;
const result = searchTool.handler(db, { query: 'graphql api' });

// 17 reusable workflow skills for common multi-step scenarios
const allSkills = skills.codexSkills;

// Thinking foundation for system prompts
const prompt = soul.renderCodexSoulPromptFoundation();
```

Every tool returns a discriminated result with `outcome: 'success' | 'no_op' |
'needs_clarification' | 'error'`, structured entities, next-step hints, and
actionable recovery advice. No thrown exceptions to parse, no ambiguous prose.

See [LLM.md](docs/LLM.md) for the full AI-facing guide covering soul, tools,
and skills.

## Tools

Seven tools shaped around operator intent, not raw storage operations:

| Tool | What it does |
|---|---|
| `search_codex` | Hybrid FTS + semantic recall across all active beliefs |
| `review_codex` | Filtered dashboard views (flags, status, trends, log) |
| `inspect_codex_item` | Detailed inspection of a single belief with full metrics |
| `remember_belief` | Capture a new claim with source, category, and provenance |
| `revise_belief` | Confirm, correct, forget, defer, or merge existing beliefs |
| `retire_belief` | Hard-delete a belief for privacy or cleanup |
| `dismiss_proximity` | Mark two nearby beliefs as intentionally distinct |

Each tool exports runtime metadata — name, description, JSON Schema, input
descriptions, side-effect level — so agent harnesses can wire them without
reading docs.

## Key Properties

- **Zero runtime dependencies.** Only `node:sqlite` (built into Node 24+).
- **Single prebundled blob.** One ESM + one CJS entry in `dist/`. No subpath
  exports, no code splitting.
- **Pure SQLite storage.** FTS5 full-text search, trigger-maintained indexes,
  and deterministic derived reads. Bring your own `DatabaseSync` instance.
- **Derived state.** Freshness, strength, integrity, review priority, and flags
  are computed at read time from fields and time, never stored as status flags.
- **Hybrid recall.** FTS5 lexical preselection + local cosine similarity over
  trigram-hash embeddings, fused with Reciprocal Rank Fusion.
- **Intention-shaped writes.** `remember`, `confirmBelief`, `correctBelief`,
  `forgetBelief`, `deferBelief`, `mergeBeliefs`, `dismissProximityPair`:
  operations that say what happened, not generic CRUD.
- **Automatic proximity.** Every write detects semantically nearby beliefs and
  returns them, so contradictions and near-duplicates surface immediately.
- **Additive AI runtime.** `soul` for posture, `tools` for actions, `skills` for
  workflow guidance — all optional, all structured.
- **Colocated tests.** Every non-type module has a colocated `.test.ts` file.
  The documented behavior is backed by executable coverage.

## Package Surface

```ts
import {
  initCodexTables,  // schema setup
  read,             // all query functions
  write,            // all mutation functions
  tools,            // LLM tool definitions + registry
  skills,           // LLM workflow skills + registry
  soul,             // thinking foundation for system prompts
} from '@ghostpaw/codex';
```

All domain and runtime types are also available at the root for TypeScript
consumers:

```ts
import type {
  CodexDb,
  BeliefRecord,
  BeliefDetailRecord,
  BeliefSource,
  BeliefCategory,
  RecallResultItem,
  FlagReasonCode,
  StrengthTier,
  StatusRecord,
  TrendRecord,
  CodexToolDefinition,
  CodexSkill,
  CodexSoul,
} from '@ghostpaw/codex';
```

## Documentation

| Document | Audience |
|---|---|
| [HUMAN.md](docs/HUMAN.md) | Human developers using the low-level `read` / `write` API |
| [LLM.md](docs/LLM.md) | Agent builders wiring `soul`, `tools`, and `skills` into LLM systems |
| [docs/README.md](docs/README.md) | Architecture overview: model, invariants, scoring, and source layout |
| [docs/entities/](docs/entities/) | Per-entity manuals with exact public API listings |

## Development

```bash
npm install
npm test            # node:test runner
npm run typecheck   # tsc --noEmit
npm run lint        # biome check
npm run build       # ESM + CJS + declarations via tsup
npm run demo:serve  # build and serve the interactive demo locally
```

The repo is pinned to **Node 24.14.0** via `.nvmrc` / `.node-version` /
`.tool-versions` / Volta. Use whichever version manager you prefer.

### Support

If this package helps your project, consider sponsoring its maintenance:

[![GitHub Sponsors](https://img.shields.io/badge/Sponsor-EA4AAA?style=for-the-badge&logo=github&logoColor=white)](https://github.com/sponsors/Anonyfox)

---

**[Anonyfox](https://anonyfox.com) • [MIT License](LICENSE)**
