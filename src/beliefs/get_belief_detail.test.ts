import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createInitializedCodexDb } from '../lib/test-db.ts';
import { correctBelief } from './correct_belief.ts';
import { forgetBelief } from './forget_belief.ts';
import { getBeliefDetail } from './get_belief_detail.ts';
import { remember } from './remember.ts';

describe('getBeliefDetail', () => {
	it('returns detail, lineage depth, and version diff data', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'REST', source: 'explicit', category: 'fact' }, { now: 1 });
		correctBelief(db, 1, { claim: 'GraphQL' }, { now: 2 });
		const detail = getBeliefDetail(db, 2, 10);
		strictEqual(detail?.lineageDepth, 2);
		strictEqual(detail?.versionDiff?.before, 'REST');
	});

	it('returns null for nonexistent belief', async () => {
		const db = await createInitializedCodexDb();
		strictEqual(getBeliefDetail(db, 999), null);
	});

	it('returns no proximity for superseded belief', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'Old claim', source: 'explicit', category: 'fact' }, { now: 1 });
		forgetBelief(db, 1, { now: 2 });
		const detail = getBeliefDetail(db, 1, 10);
		strictEqual(detail !== null, true);
		strictEqual(detail?.isActive, false);
		strictEqual(detail?.proximity.length, 0);
	});

	it('returns null versionDiff for a belief with no predecessor', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'Fresh claim', source: 'explicit', category: 'fact' }, { now: 1 });
		const detail = getBeliefDetail(db, 1, 10);
		strictEqual(detail?.versionDiff, null);
	});

	it('returns proximity for active beliefs with neighbors', async () => {
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
		const detail = getBeliefDetail(db, 1, 10);
		strictEqual(detail !== null, true);
		strictEqual(Array.isArray(detail?.proximity), true);
	});

	it('returns lineageDepth of 1 for standalone belief', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'Solo', source: 'explicit', category: 'fact' }, { now: 1 });
		const detail = getBeliefDetail(db, 1, 10);
		strictEqual(detail?.lineageDepth, 1);
	});
});
