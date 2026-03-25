# Codex

A standalone belief and memory engine for Node.js, built on SQLite.

Codex stores claims with certainty, evidence, provenance, decay, and revision lineage. It is not a journal, transcript archive, or flat note list. It is the system for what is currently believed, how strongly, why, and how that understanding has changed over time.

## Install

```bash
npm install @ghostpaw/codex
```

Requires **Node.js 24+**.

## Quick Start

```ts
import { DatabaseSync } from 'node:sqlite';
import { initCodexTables, read, write } from '@ghostpaw/codex';

const db = new DatabaseSync(':memory:');
initCodexTables(db);

const belief = write.remember(db, {
  claim: 'The API uses GraphQL.',
  source: 'explicit',
  category: 'fact',
});

write.confirmBelief(db, belief.id);
const results = read.recall(db, 'graphql api');
```

## Package Surface

```ts
import {
  initCodexTables,
  read,
  write,
  tools,
  skills,
  soul,
} from '@ghostpaw/codex';
```

## Documentation

- `docs/README.md`: architecture and source layout
- `docs/HUMAN.md`: direct-code usage
- `docs/LLM.md`: tools, skills, and soul runtime
- `docs/entities/BELIEFS.md`: belief entity manual
- `docs/entities/DISMISSALS.md`: dismissal support manual

## Development

```bash
npm install
npm test
npm run typecheck
npm run lint
npm run build
```
