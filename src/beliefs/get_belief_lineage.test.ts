import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createInitializedCodexDb } from '../lib/test-db.ts';
import { correctBelief } from './correct_belief.ts';
import { getBeliefLineage } from './get_belief_lineage.ts';
import { mergeBeliefs } from './merge_beliefs.ts';
import { remember } from './remember.ts';

describe('getBeliefLineage', () => {
	it('returns the lineage component in creation order', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'REST', source: 'explicit', category: 'fact' }, { now: 1 });
		correctBelief(db, 1, { claim: 'GraphQL' }, { now: 2 });
		strictEqual(getBeliefLineage(db, 2, 2).length, 2);
	});

	it('returns empty for nonexistent belief', async () => {
		const db = await createInitializedCodexDb();
		strictEqual(getBeliefLineage(db, 999).length, 0);
	});

	it('returns single belief when no lineage exists', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'Solo', source: 'explicit', category: 'fact' }, { now: 1 });
		const lineage = getBeliefLineage(db, 1, 10);
		strictEqual(lineage.length, 1);
		strictEqual(lineage[0]?.claim, 'Solo');
	});

	it('traverses a chain of corrections', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'V1', source: 'explicit', category: 'fact' }, { now: 1 });
		correctBelief(db, 1, { claim: 'V2' }, { now: 2 });
		correctBelief(db, 2, { claim: 'V3' }, { now: 3 });
		correctBelief(db, 3, { claim: 'V4' }, { now: 4 });
		const lineage = getBeliefLineage(db, 4, 10);
		strictEqual(lineage.length, 4);
		strictEqual(lineage[0]?.claim, 'V1');
		strictEqual(lineage[3]?.claim, 'V4');
	});

	it('includes merge branches in the lineage', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'A', source: 'explicit', category: 'fact' }, { now: 1 });
		remember(db, { claim: 'B', source: 'explicit', category: 'fact' }, { now: 2 });
		mergeBeliefs(db, { beliefIds: [1, 2], claim: 'A+B' }, { now: 3 });
		const lineage = getBeliefLineage(db, 3, 10);
		strictEqual(lineage.length, 3);
	});

	it('returns the same lineage regardless of which node is queried', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'V1', source: 'explicit', category: 'fact' }, { now: 1 });
		correctBelief(db, 1, { claim: 'V2' }, { now: 2 });
		const fromOld = getBeliefLineage(db, 1, 10);
		const fromNew = getBeliefLineage(db, 2, 10);
		strictEqual(fromOld.length, fromNew.length);
	});
});
