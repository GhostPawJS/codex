import { strictEqual, throws } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createInitializedCodexDb } from '../lib/test-db.ts';
import { remember } from './remember.ts';

describe('remember', () => {
	it('creates a new active belief with prepared recall data', async () => {
		const db = await createInitializedCodexDb();
		const result = remember(
			db,
			{ claim: 'GraphQL API', source: 'explicit', category: 'fact' },
			{ now: 10 },
		);
		strictEqual(result.claim, 'GraphQL API');
		strictEqual(result.isActive, true);
		const ftsRow = db
			.prepare('SELECT rowid FROM beliefs_fts WHERE beliefs_fts MATCH ?')
			.get('graphql');
		strictEqual(Number(ftsRow?.rowid ?? 0), 1);
	});

	it('returns proximity matches by default', async () => {
		const db = await createInitializedCodexDb();
		remember(
			db,
			{ claim: 'The API uses GraphQL', source: 'explicit', category: 'fact' },
			{ now: 1 },
		);
		const result = remember(
			db,
			{ claim: 'GraphQL powers the API', source: 'observed', category: 'fact' },
			{ now: 2 },
		);
		strictEqual(Array.isArray(result.proximity), true);
	});

	it('skips proximity when skipProximity is true', async () => {
		const db = await createInitializedCodexDb();
		remember(
			db,
			{ claim: 'The API uses GraphQL', source: 'explicit', category: 'fact' },
			{ now: 1 },
		);
		const result = remember(
			db,
			{ claim: 'GraphQL powers the API', source: 'observed', category: 'fact' },
			{ now: 2, skipProximity: true },
		);
		strictEqual(result.proximity.length, 0);
	});

	it('rejects empty claims', async () => {
		const db = await createInitializedCodexDb();
		throws(
			() => remember(db, { claim: ' ', source: 'explicit', category: 'fact' }),
			/must not be empty/i,
		);
	});

	it('rejects invalid source', async () => {
		const db = await createInitializedCodexDb();
		throws(
			() => remember(db, { claim: 'x', source: 'invalid' as 'explicit', category: 'fact' }),
			/unsupported belief source/i,
		);
	});

	it('rejects invalid category', async () => {
		const db = await createInitializedCodexDb();
		throws(
			() => remember(db, { claim: 'x', source: 'explicit', category: 'invalid' as 'fact' }),
			/unsupported belief category/i,
		);
	});

	it('clamps certainty below 0.1 to 0.1', async () => {
		const db = await createInitializedCodexDb();
		const result = remember(
			db,
			{ claim: 'Low certainty', source: 'explicit', category: 'fact', certainty: 0.01 },
			{ now: 1 },
		);
		strictEqual(result.certainty, 0.1);
	});

	it('clamps certainty above 0.99 to 0.99', async () => {
		const db = await createInitializedCodexDb();
		const result = remember(
			db,
			{ claim: 'Max certainty', source: 'explicit', category: 'fact', certainty: 1.5 },
			{ now: 1 },
		);
		strictEqual(result.certainty, 0.99);
	});

	it('allows duplicate claims as separate beliefs', async () => {
		const db = await createInitializedCodexDb();
		const a = remember(
			db,
			{ claim: 'Same claim', source: 'explicit', category: 'fact' },
			{ now: 1 },
		);
		const b = remember(
			db,
			{ claim: 'Same claim', source: 'observed', category: 'fact' },
			{ now: 2 },
		);
		strictEqual(a.id !== b.id, true);
	});

	it('uses source-weighted initial certainty when not provided', async () => {
		const db = await createInitializedCodexDb();
		const explicit = remember(
			db,
			{ claim: 'Explicit', source: 'explicit', category: 'fact' },
			{ now: 1 },
		);
		const inferred = remember(
			db,
			{ claim: 'Inferred', source: 'inferred', category: 'fact' },
			{ now: 2 },
		);
		strictEqual(explicit.certainty, 0.9);
		strictEqual(inferred.certainty, 0.5);
	});
});
