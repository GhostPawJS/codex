import { deepStrictEqual, ok, strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { forgetBelief } from '../beliefs/forget_belief.ts';
import { listBeliefProximity } from '../beliefs/list_belief_proximity.ts';
import { remember } from '../beliefs/remember.ts';
import { recordDismissal } from '../dismissals/record_dismissal.ts';
import { createInitializedCodexDb } from '../lib/test-db.ts';
import { reviewCodexTool, reviewCodexToolHandler } from './review_codex_tool.ts';

describe('reviewCodexTool', () => {
	it('has correct name and metadata', () => {
		strictEqual(reviewCodexTool.name, 'review_codex');
		strictEqual(reviewCodexTool.readOnly, true);
		strictEqual(reviewCodexTool.sideEffects, 'none');
		strictEqual(typeof reviewCodexTool.whenToUse, 'string');
		strictEqual(typeof reviewCodexTool.whenNotToUse, 'string');
	});
});

describe('reviewCodexToolHandler', () => {
	it('loads flags view with empty codex', async () => {
		const db = await createInitializedCodexDb();
		const result = reviewCodexToolHandler(db, { view: 'flags' });
		strictEqual(result.ok, true);
		if (result.ok) {
			ok(result.warnings?.some((w) => w.code === 'empty_result'));
		}
	});

	it('loads flags view with flaggable beliefs', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'Old inferred', source: 'inferred', category: 'fact' }, { now: 1 });
		const yearMs = 365 * 24 * 60 * 60 * 1000;
		const result = reviewCodexToolHandler(db, { view: 'flags', now: yearMs });
		strictEqual(result.ok, true);
		if (result.ok) {
			ok(result.entities.length >= 1);
			ok(result.next && result.next.length > 0);
		}
	});

	it('loads status view with integrity in summary', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'Test', source: 'explicit', category: 'fact' }, { now: 1 });
		const result = reviewCodexToolHandler(db, { view: 'status' });
		strictEqual(result.ok, true);
		ok(result.summary.includes('integrity'));
	});

	it('loads log view', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'Logged', source: 'explicit', category: 'fact' }, { now: 1 });
		const result = reviewCodexToolHandler(db, { view: 'log' });
		strictEqual(result.ok, true);
		if (result.ok) strictEqual(result.entities.length >= 1, true);
	});

	it('loads trends view', async () => {
		const db = await createInitializedCodexDb();
		const result = reviewCodexToolHandler(db, { view: 'trends' });
		strictEqual(result.ok, true);
		ok(result.summary.includes('categor'));
	});

	it('passes limit to log view', async () => {
		const db = await createInitializedCodexDb();
		for (let i = 0; i < 5; i++) {
			remember(db, { claim: `Belief ${i}`, source: 'explicit', category: 'fact' }, { now: i + 1 });
		}
		const result = reviewCodexToolHandler(db, { view: 'log', limit: 2 });
		strictEqual(result.ok, true);
	});
});

it('counts active prefixes and immediately lists undismissed duplicate pairs', async () => {
	const db = await createInitializedCodexDb();
	try {
		const add = (claim: string) =>
			remember(db, { claim, source: 'explicit', category: 'fact', allowDuplicate: true });
		add(' team : Deploy the service every Tuesday morning');
		add('team: Deploy the service every Tuesday morning');
		add('team: Deploy the service every Tuesday morning');
		add('Unrelated');
		add('gone: retired');
		forgetBelief(db, 5);
		const status = reviewCodexToolHandler(db, { view: 'status', byPrefix: true });
		ok(status.ok && status.data.payload.view === 'status');
		deepStrictEqual(status.data.payload.data.prefixCounts, [
			{ prefix: 'team', count: 3 },
			{ prefix: '(none)', count: 1 },
		]);
		const plain = reviewCodexToolHandler(db, { view: 'status' });
		ok(plain.ok && plain.data.payload.view === 'status');
		strictEqual('prefixCounts' in plain.data.payload.data, false);
		const result = reviewCodexToolHandler(db, { view: 'duplicates', limit: 1 });
		ok(result.ok && result.data.payload.view === 'duplicates');
		strictEqual(result.data.payload.data.length, 1);
		const pair = result.data.payload.data[0];
		ok(pair);
		strictEqual(
			pair.similarity,
			listBeliefProximity(db, pair.beliefA, 10).find((r) => r.id === pair.beliefB)?.similarity,
		);
		recordDismissal(db, pair.beliefA, pair.beliefB, Date.now());
		const dismissed = reviewCodexToolHandler(db, { view: 'duplicates' });
		ok(dismissed.ok && dismissed.data.payload.view === 'duplicates');
		ok(
			dismissed.data.payload.data.every(
				(p) => p.beliefA !== pair.beliefA || p.beliefB !== pair.beliefB,
			),
		);
		const empty = reviewCodexToolHandler(db, { view: 'duplicates', limit: 0 });
		ok(empty.ok && empty.data.payload.view === 'duplicates');
		deepStrictEqual(empty.data.payload.data, []);
	} finally {
		db.close();
	}
});
