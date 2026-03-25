# Codex Docs

This folder is the operator and implementer manual for Codex.

The source of truth for the actual SQLite schema lives in code under `src/`. These docs describe what each concept is for, why it exists, how it should be used, and which public APIs belong to it.

## Manuals

- `entities/BELIEFS.md`: the core belief record and its lifecycle
- `entities/DISMISSALS.md`: suppression and backoff for misleading proximity pairs

Exact public APIs live at the bottom of each entity manual.

## Core Separations

- `beliefs` own claims, certainty, evidence, provenance, verification time, and lineage
- `dismissals` own temporary suppression of bad proximity pair resurfacing
- read surfaces such as recall, flags, status, log, trends, and proximity are derived from stored state
- `tools`, `skills`, and `soul` are additive runtime layers over the same direct-code API
