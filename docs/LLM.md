# Codex LLM Building Blocks

This document is for harness builders using Codex's additive agent-facing
runtime.

If you are a human operator using the direct package surface in ordinary code,
read [`HUMAN.md`](HUMAN.md) instead. That document covers `initCodexTables`,
`read`, `write`, `types`, and `errors`. This document is only about:

- `soul`
- `tools`
- `skills`

Typical harness-facing usage:

```ts
import { skills, soul, tools } from '@ghostpaw/codex';
```

## Runtime Stack

Codex's additive runtime is intentionally layered:

1. `soul`
2. `tools`
3. `skills`

The layers work together like this:

- `soul` shapes posture and judgment
- `tools` are the executable action surface
- `skills` teach recurring workflows built from tools

## Soul

The soul is the thinking foundation.

It does not define what the model can do. It defines how the model should see
beliefs, which epistemic boundaries it should protect, and what kind of judgment
it should apply before touching stored state.

Codex exports this through the root `soul` namespace:

- `soul.codexSoul`
- `soul.codexSoulEssence`
- `soul.codexSoulTraits`
- `soul.renderCodexSoulPromptFoundation()`

The runtime soul shape is:

```ts
interface CodexSoul {
  slug: string;
  name: string;
  description: string;
  essence: string;
  traits: readonly {
    principle: string;
    provenance: string;
  }[];
}
```

The current soul is `Epistemic Warden`, with the slug `epistemic-warden`.

Its job is to keep the system's record of what is currently believed, how
strongly, why, and how that understanding has changed over time honest enough
that future retrieval and revision stay trustworthy.

The essence establishes four boundaries:

- belief is not truth — certainty is confidence, not correctness
- active, superseded, and deleted are three different states with different verbs
- derived signals (flags, scores, proximity) are attention guides, not verdicts
- maintenance compounds value more than capture volume

The currently exported principles are:

- one claim per belief, honestly weighted
- prefer lineage over erasure
- read derived signals before prescribing action
- choose the smallest honest mutation
- maintenance is the value, not capture

Use the soul layer for:

- system or role-prompt foundation
- reminding the model to protect epistemic honesty
- reinforcing that each verb carries different weight
- priming the model to read flags and proximity before acting

Do not use the soul layer as an execution surface.

## Tools

The direct library surface is intentionally explicit. That is good for humans,
but too many choices for reliable LLM selection. The `tools` facade reconciles
the public direct surface into a smaller set of intent-shaped tools with:

- fewer top-level choices
- strict JSON-schema-compatible inputs
- explicit action and view discriminators
- structured machine-readable outcomes
- clarification paths for ambiguous input

The current `tools` namespace exports exactly these 7 tools:

- `search_codex` — find beliefs by natural-language query with ranked recall
- `review_codex` — load a maintenance surface: flags, status, log, or trends
- `inspect_codex_item` — full detail on one belief: lineage, proximity, version diff
- `remember_belief` — create a new belief with source, category, and certainty
- `revise_belief` — revise an existing belief: confirm, correct, merge, forget, or defer
- `retire_belief` — permanently delete a belief and its lineage chain
- `dismiss_proximity` — suppress a false-positive proximity pair with exponential backoff

These tools are intentionally shaped around user intent rather than raw storage
operations. Read tools (`search_codex`, `review_codex`, `inspect_codex_item`)
have no side effects. Write tools (`remember_belief`, `revise_belief`,
`retire_belief`, `dismiss_proximity`) mutate state and document what changed.

### Tool definition shape

Each tool exports a handler function and a full metadata definition:

```ts
interface CodexToolDefinition<TInput, TOutput> {
  name: string;
  description: string;
  whenToUse: string;
  whenNotToUse: string;
  sideEffects: 'none' | 'writes_state';
  readOnly: boolean;
  supportsClarification: boolean;
  targetKinds: readonly ('belief' | 'dismissal')[];
  inputDescriptions: Record<string, string>;
  outputDescription: string;
  inputSchema: JsonSchema;
  handler: (db: CodexDb, input: TInput) => ToolResult<TOutput>;
}
```

The canonical registry is surfaced at the package root through `tools`:

- `tools.codexTools`
- `tools.listCodexToolDefinitions()`
- `tools.getCodexToolByName()`

The public API reconciliation table is exported as `tools.codexToolMappings`.

### Tool outcomes

Every tool returns one of four outcomes:

- `success` — the operation completed as expected
- `no_op` — the operation was valid but nothing changed
- `needs_clarification` — the input was ambiguous; missing fields are listed
- `error` — the operation failed; error kind, code, and recovery hint are provided

Failures are categorized explicitly:

- `protocol` — input shape or validation issue
- `domain` — business logic violation (not found, invalid state)
- `system` — unexpected runtime error

That means a harness does not need to infer intent from thrown exceptions or
vague prose.

### Output conventions

All tool results follow a consistent shape:

```ts
interface ToolSuccess<TData> {
  ok: true;
  outcome: 'success' | 'no_op';
  summary: string;
  data: TData;
  entities: ToolEntityRef[];
  warnings?: ToolWarning[];
  next?: ToolNextStepHint[];
}
```

Common fields across tools:

- `summary` — a one-line human-readable description of what happened
- `entities` — referenced beliefs or dismissals, for harness linking
- `warnings` — `empty_result`, `partial_match`, or `unchanged` codes
- `next` — suggested follow-up actions with tool name and suggested input

Read tools return ranked items or structured review payloads. Write tools return
the mutated record plus proximity matches and lineage context where applicable.

### The `revise_belief` tool

This is the most powerful tool. It consolidates five verbs into a single action
discriminator:

| Action    | What it does                                       | Required fields                 |
| --------- | -------------------------------------------------- | ------------------------------- |
| `confirm` | Reinforce an existing belief                       | `beliefId`                      |
| `correct` | Supersede with a replacement claim                 | `beliefId`, `claim`             |
| `merge`   | Consolidate multiple beliefs into one               | `beliefIds` (2+)               |
| `forget`  | Remove from active recall, preserve audit trail     | `beliefId`                      |
| `defer`   | Postpone flag eligibility until a future timestamp  | `beliefId`, `deferredUntil`     |

Optional fields like `successorId`, `source`, `category`, and `certainty` are
accepted where they make sense. When required fields are missing, the tool
returns `needs_clarification` with the missing field names.

## Skills

The tool layer makes action selection smaller and clearer, but recurring belief
management workflows still benefit from reusable guidance.

The `skills` layer sits above `tools` and packages the main operating patterns
into prompt-ready blocks that a harness can inject into model context or
retrieve by name.

Each skill exports:

- `name` — kebab-case identifier for routing
- `description` — one-line summary for LLM pattern matching
- `content` — full markdown playbook with steps, tools, validation, and pitfalls

The runtime shape is:

```ts
interface CodexSkill {
  name: string;
  description: string;
  content: string;
}
```

Skills are not handlers. They are reusable guidance objects that teach:

- which tools to prefer
- how to sequence them
- how to validate the outcome
- which pitfalls to avoid

The canonical registry is surfaced at the package root through `skills`:

- `skills.codexSkills`
- `skills.listCodexSkills()`
- `skills.getCodexSkillByName()`

The current `skills` namespace exports these 17 workflow blocks:

- `search-and-retrieve-beliefs` — find relevant beliefs without scanning the whole codex
- `capture-beliefs-well` — capture one belief per claim with correct metadata
- `review-flags-batch` — process a queue of flagged beliefs by reason code
- `resolve-near-duplicate-beliefs` — decide whether proximate beliefs are duplicates, successors, or distinct
- `correct-belief-lineage-honestly` — use correct instead of forget+remember to preserve lineage
- `handle-ambiguous-belief-updates` — choose the right verb when new information collides with existing beliefs
- `process-stale-beliefs` — refresh or retire beliefs whose freshness has dropped too far
- `run-calibration-pass` — detect systematic overconfidence in certainty estimates
- `defer-beliefs-pending-outcomes` — postpone flag processing for beliefs that depend on future events
- `erase-beliefs-for-privacy` — choose between forget and retire based on privacy requirements
- `batch-ingest-with-deduplication` — high-volume capture that avoids duplicates
- `diagnose-declining-integrity` — find the root cause when integrity is dropping
- `upgrade-source-evidence` — promote a belief to a stronger source when direct evidence arrives
- `pre-register-beliefs-before-decisions` — anchor beliefs with honest certainty before outcomes
- `direct-supersession-between-beliefs` — express that one belief covers another without creating a new entry
- `dismiss-false-proximity-pairs` — suppress proximity pairs that are topically near but genuinely distinct
- `monitor-portfolio-health` — regular status and trends review as a maintenance ritual

Each skill's `content` follows a consistent template:

- **Primary tools** — which tools the skill uses
- **Goal** — what the skill achieves
- **When to use** — situation triggers
- **When not to use** — anti-patterns
- **Step-by-step sequence** — how to combine the tools
- **Validation checks** — what to verify after
- **Pitfalls** — failure modes to avoid
- **Tips and tricks** — non-obvious guidance
- **Tool calls to prefer** — explicit tool recommendations
- **Related skills** — cross-references to other skills

## How The Layers Fit Together

A good Codex-based LLM system typically uses the layers in this order:

1. Start from the soul so the model is primed with the right epistemic judgment.
2. Expose the tools so the model has a clean action surface.
3. Load relevant skills so common belief-management situations do not have to be
   improvised from scratch.

That gives the system:

- a thinking posture (soul)
- an execution surface (tools)
- reusable operational playbooks (skills)
- all backed by real runtime exports instead of prose-only conventions

## Design Boundary

`soul`, `tools`, and `skills` are additive. They do not replace the direct
library surface.

Humans still get the precise direct-code API through `read` and `write`. Agents
get a smaller, clearer runtime stack on top of the same truthful core:

- `soul` for behavioral foundation
- `tools` for actions
- `skills` for workflow guidance

Both operate on the same underlying model. The same deterministic engine runs
underneath whether the caller is a TypeScript function call or an LLM tool
invocation.
