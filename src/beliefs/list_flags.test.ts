import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createInitializedCodexDb } from '../lib/test-db.ts';
import { correctBelief } from './correct_belief.ts';
import { deferBelief } from './defer_belief.ts';
import { listFlags } from './list_flags.ts';
import { remember } from './remember.ts';

const YEAR_MS = 365 * 24 * 60 * 60 * 1000;

describe('listFlags', () => {
	it('returns active beliefs that need attention', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'API uses REST', source: 'inferred', category: 'fact' }, { now: 1 });
		const flags = listFlags(db, YEAR_MS);
		strictEqual(flags.length >= 1, true);
		strictEqual(flags[0]?.reasonCodes.includes('stale'), true);
	});

	it('exposes lineageDepth on flag results', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'API uses REST', source: 'inferred', category: 'fact' }, { now: 1 });
		const flags = listFlags(db, YEAR_MS);
		strictEqual(typeof flags[0]?.lineageDepth, 'number');
	});

	it('returns empty for empty codex', async () => {
		const db = await createInitializedCodexDb();
		const flags = listFlags(db, 1);
		strictEqual(flags.length, 0);
	});

	it('excludes deferred beliefs', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'Deferred belief', source: 'inferred', category: 'fact' }, { now: 1 });
		deferBelief(db, 1, YEAR_MS + 1000, { now: 2 });
		const flags = listFlags(db, YEAR_MS);
		strictEqual(flags.length, 0);
	});

	it('includes deferred beliefs after deferral expires', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'Deferred belief', source: 'inferred', category: 'fact' }, { now: 1 });
		deferBelief(db, 1, 50, { now: 2 });
		const flags = listFlags(db, YEAR_MS);
		strictEqual(flags.length >= 1, true);
	});

	it('flags unstable beliefs with deep lineage', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'V1', source: 'explicit', category: 'fact' }, { now: 1 });
		correctBelief(db, 1, { claim: 'V2' }, { now: 2 });
		correctBelief(db, 2, { claim: 'V3' }, { now: 3 });
		const flags = listFlags(db, YEAR_MS);
		const unstable = flags.filter((f) => f.reasonCodes.includes('unstable'));
		strictEqual(unstable.length >= 1, true);
		strictEqual(unstable[0]?.lineageDepth, 3);
	});

	it('flags single_evidence beliefs', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'Unconfirmed fact', source: 'explicit', category: 'fact' }, { now: 1 });
		const flags = listFlags(db, YEAR_MS);
		strictEqual(flags[0]?.reasonCodes.includes('single_evidence'), true);
	});

	it('flags low_trust sources', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'Inferred thing', source: 'inferred', category: 'fact' }, { now: 1 });
		const flags = listFlags(db, YEAR_MS);
		strictEqual(flags[0]?.reasonCodes.includes('low_trust'), true);
	});

	it('sorts by review priority descending', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'Very old inferred', source: 'inferred', category: 'fact' }, { now: 1 });
		remember(
			db,
			{ claim: 'Slightly old explicit', source: 'explicit', category: 'fact' },
			{ now: YEAR_MS / 2 },
		);
		const flags = listFlags(db, YEAR_MS);
		for (let i = 1; i < flags.length; i++) {
			const prev = flags[i - 1]?.reviewPriority ?? 0;
			const curr = flags[i]?.reviewPriority ?? 0;
			strictEqual(prev >= curr, true);
		}
	});
});
