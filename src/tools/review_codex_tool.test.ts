import { ok, strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { remember } from '../beliefs/remember.ts';
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
