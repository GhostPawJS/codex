# `dismissals`

## What It Is

`dismissals` is the small support concept that suppresses resurfacing of belief pairs previously judged unrelated or unhelpful.

## Why It Exists

Proximity is useful only if the same bad comparison does not keep coming back every time the operator inspects a belief.

## How To Use It

Most callers touch dismissals only through one explicit action when rejecting a proximity pair.

## Good Uses

- dismissing near-duplicate false positives
- dismissing repeated lexical collisions
- suppressing semantically weak comparisons for a while

## Do Not Use It For

- contradiction truth storage
- permanent bans
- manual tagging
- ontology management

## Canonical Pair Rules

Dismissal rows use canonical pair ordering so `(a, b)` and `(b, a)` are the same pair.

## Backoff Behavior

Each dismissal increases the backoff window before the pair may resurface again.

## Related Concepts

- `beliefs`
- `read.listBeliefProximity()`
- hybrid recall and proximity filtering

## Public APIs

### Writes

- `write.dismissProximityPair(db, beliefA, beliefB, now?)`

### Reads

Dismissals are primarily a support concept surfaced through proximity behavior. They do not currently expose a dedicated public read surface.
