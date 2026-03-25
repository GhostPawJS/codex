# Human Guide

Use Codex through the direct-code `read` and `write` namespaces.

## Typical Flow

1. `write.remember()` to add a belief.
2. `write.confirmBelief()` when evidence accumulates.
3. `write.correctBelief()` when the belief changes.
4. `read.recall()` to retrieve active beliefs.
5. `read.listFlags()` to review weak or stale beliefs.
6. `read.getBeliefDetail()` and `read.getBeliefLineage()` to inspect one belief deeply.
