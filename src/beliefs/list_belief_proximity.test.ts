import { strictEqual, throws } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { recordDismissal } from '../dismissals/record_dismissal.ts';
import { createInitializedCodexDb } from '../lib/test-db.ts';
import { forgetBelief } from './forget_belief.ts';
import { listBeliefProximity } from './list_belief_proximity.ts';
import { remember } from './remember.ts';

describe('listBeliefProximity', () => {
	it('returns nearby active beliefs and respects dismissals', async () => {
		const db = await createInitializedCodexDb();
		remember(
			db,
			{ claim: 'The API uses GraphQL', source: 'explicit', category: 'fact' },
			{ now: 1 },
		);
		remember(
			db,
			{ claim: 'GraphQL powers the API', source: 'observed', category: 'fact' },
			{ now: 2 },
		);
		strictEqual(listBeliefProximity(db, 1, 3, 0, 10).length, 1);
		recordDismissal(db, 1, 2, 10);
		strictEqual(listBeliefProximity(db, 1, 3, 0, 10).length, 0);
	});

	it('throws for nonexistent belief', async () => {
		const db = await createInitializedCodexDb();
		throws(() => listBeliefProximity(db, 999), /not found/i);
	});

	it('throws for superseded belief', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'Gone', source: 'explicit', category: 'fact' }, { now: 1 });
		forgetBelief(db, 1, { now: 2 });
		throws(() => listBeliefProximity(db, 1), /not found/i);
	});

	it('returns empty when no other active beliefs exist', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'Solo belief', source: 'explicit', category: 'fact' }, { now: 1 });
		const prox = listBeliefProximity(db, 1, 3, 0, 10);
		strictEqual(prox.length, 0);
	});

	it('respects similarity threshold', async () => {
		const db = await createInitializedCodexDb();
		remember(
			db,
			{ claim: 'TypeScript strict mode', source: 'explicit', category: 'fact' },
			{ now: 1 },
		);
		remember(
			db,
			{ claim: 'Python virtual environments', source: 'explicit', category: 'fact' },
			{ now: 2 },
		);
		const highThreshold = listBeliefProximity(db, 1, 3, 0.99, 10);
		const lowThreshold = listBeliefProximity(db, 1, 3, 0.0, 10);
		strictEqual(lowThreshold.length >= highThreshold.length, true);
	});

	it('respects limit parameter', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'GraphQL API design', source: 'explicit', category: 'fact' }, { now: 1 });
		remember(db, { claim: 'GraphQL API schema', source: 'explicit', category: 'fact' }, { now: 2 });
		remember(
			db,
			{ claim: 'GraphQL API queries', source: 'explicit', category: 'fact' },
			{ now: 3 },
		);
		remember(
			db,
			{ claim: 'GraphQL API mutations', source: 'explicit', category: 'fact' },
			{ now: 4 },
		);
		const prox = listBeliefProximity(db, 1, 2, 0, 10);
		strictEqual(prox.length <= 2, true);
	});

	it('includes similarity score on results', async () => {
		const db = await createInitializedCodexDb();
		remember(
			db,
			{ claim: 'The API uses GraphQL', source: 'explicit', category: 'fact' },
			{ now: 1 },
		);
		remember(
			db,
			{ claim: 'GraphQL powers the API', source: 'observed', category: 'fact' },
			{ now: 2 },
		);
		const prox = listBeliefProximity(db, 1, 3, 0, 10);
		strictEqual(prox.length >= 1, true);
		strictEqual(typeof prox[0]?.similarity, 'number');
		const sim = prox[0]?.similarity ?? -1;
		strictEqual(sim >= 0 && sim <= 1, true);
	});

	it('resumes showing dismissed pair after backoff expires', async () => {
		const db = await createInitializedCodexDb();
		remember(
			db,
			{ claim: 'The API uses GraphQL', source: 'explicit', category: 'fact' },
			{ now: 1 },
		);
		remember(
			db,
			{ claim: 'GraphQL powers the API', source: 'observed', category: 'fact' },
			{ now: 2 },
		);
		recordDismissal(db, 1, 2, 10);
		strictEqual(listBeliefProximity(db, 1, 3, 0, 10).length, 0);
		const farFuture = 10 + 91 * 24 * 60 * 60 * 1000;
		strictEqual(listBeliefProximity(db, 1, 3, 0, farFuture).length, 1);
	});
});
