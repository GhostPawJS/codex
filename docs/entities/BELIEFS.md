# `beliefs`

## What It Is

`beliefs` is the canonical record of what Codex currently holds as believed.

A belief is one claim plus the minimum metadata needed to rank, revise, and maintain it: certainty, evidence count, source, category, provenance, verification time, and supersession linkage.

## Why It Exists

Codex is not a journal, transcript archive, or note store. It needs one entity that answers: what is currently believed, how strongly, why, and what replaced it when understanding changed.

## How To Use It

Use beliefs through the main lifecycle verbs:

1. `write.remember()`
2. `write.confirmBelief()`
3. `write.correctBelief()`
4. `write.mergeBeliefs()`
5. `write.forgetBelief()`
6. `write.deleteBelief()`
7. `write.deferBelief()`

## Good Uses

- preferences
- facts
- procedures
- capabilities
- project assumptions

## Do Not Use It For

- tasks and commitments
- relationships
- transcripts
- raw event history
- large compound claims that should be split into separate beliefs

## Source Enum

- `explicit`
- `observed`
- `distilled`
- `inferred`

## Category Enum

- `preference`
- `fact`
- `procedure`
- `capability`
- `custom`

## Lineage And Supersession

Beliefs are corrected through supersession instead of overwrite. Once understanding changes, the previous belief remains in lineage so the codex can show what used to be believed and what replaced it.

Merging combines evidence by summing the independent inputs. With `successorId`,
the successor gains only the merged-in evidence, without counting itself twice.
Explicit `certainty` takes precedence; otherwise merge certainty is the maximum
of the source initial certainty and all input certainties, including an existing
successor. Supersession stores whether a belief was corrected, merged or forgotten.
Legacy rows use self-pointers and predecessor counts as a fallback. Calibration
counts only corrections of beliefs with certainty at least 0.8. Repeated revision
means two or more corrections in the active belief's correction chain, excluding
merge fan-in.

Flags allow a seven-day grace period from `createdAt`: `single_evidence`,
`low_trust` and `gap` are suppressed before that age. `stale`, `fading` and
`unstable` remain eligible. Deferral suppresses all flags until its timestamp.

## Retrieval Notes

Recall is hybrid by default: FTS5 preselection plus local vector reranking. Beliefs are prepared for recall automatically on writes.

Query tokens use document-frequency weighting over active beliefs. Common tokens
(more than half the active set, when at least three beliefs exist) and English
stopwords receive less weight in the query embedding and do not select lexical
candidates alone when informative matches exist. Results below 55% of the best
weighted lexical coverage plus semantic similarity are dropped. If only common
terms match, at most three results are returned in lexical order, and the search
tool reports a warning. Ranking is deterministic. `minScore` still filters the
final fusion score and defaults to 0.01; the relative cutoff also applies.

## Related Concepts

- `dismissals`: temporary suppression of misleading proximity pair resurfacing

## Public APIs

### Writes

- `write.remember(db, input, now?)`
- `write.confirmBelief(db, beliefId, now?)`
- `write.correctBelief(db, beliefId, input, now?)`
- `write.mergeBeliefs(db, input, now?)`
- `write.forgetBelief(db, beliefId, successorId?, now?)`
- `write.deleteBelief(db, beliefId)`
- `write.deferBelief(db, beliefId, deferredUntil, now?)`

### Reads

- `read.recall(db, query, options?)`
- `read.getBeliefDetail(db, beliefId, now?)`
- `read.getBeliefLineage(db, beliefId, now?)`
- `read.listFlags(db, now?)`
- `read.getStatus(db, now?)`
- `read.listLog(db, limit?)`
- `read.getTrends(db)`
- `read.listBeliefProximity(db, beliefId, limit?, threshold?, now?)`
