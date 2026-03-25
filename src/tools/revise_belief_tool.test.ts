import { ok, strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { remember } from '../beliefs/remember.ts';
import { createInitializedCodexDb } from '../lib/test-db.ts';
import { reviseBeliefTool, reviseBeliefToolHandler } from './revise_belief_tool.ts';

describe('reviseBeliefTool', () => {
	it('has correct name and metadata', () => {
		strictEqual(reviseBeliefTool.name, 'revise_belief');
		strictEqual(reviseBeliefTool.readOnly, false);
		strictEqual(reviseBeliefTool.sideEffects, 'writes_state');
		strictEqual(reviseBeliefTool.supportsClarification, true);
		strictEqual(typeof reviseBeliefTool.whenToUse, 'string');
		strictEqual(typeof reviseBeliefTool.whenNotToUse, 'string');
	});
});

describe('reviseBeliefToolHandler — confirm', () => {
	it('confirms a belief with certainty increase', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'REST API', source: 'explicit', category: 'fact' }, { now: 1 });
		const result = reviseBeliefToolHandler(db, { action: 'confirm', beliefId: 1 });
		strictEqual(result.ok, true);
		ok(result.summary.includes('Confirmed'));
	});

	it('asks for clarification when beliefId is missing', async () => {
		const db = await createInitializedCodexDb();
		const result = reviseBeliefToolHandler(db, { action: 'confirm' });
		strictEqual(result.ok, false);
		strictEqual(result.outcome, 'needs_clarification');
	});

	it('returns not_found error for nonexistent belief', async () => {
		const db = await createInitializedCodexDb();
		const result = reviseBeliefToolHandler(db, { action: 'confirm', beliefId: 999 });
		strictEqual(result.ok, false);
		if (!result.ok && result.outcome === 'error') {
			strictEqual(result.error.code, 'not_found');
			ok(result.error.recovery);
			ok(result.next && result.next.length > 0);
		}
	});
});

describe('reviseBeliefToolHandler — correct', () => {
	it('corrects a belief and returns superseded info', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'REST API', source: 'explicit', category: 'fact' }, { now: 1 });
		const result = reviseBeliefToolHandler(db, {
			action: 'correct',
			beliefId: 1,
			claim: 'GraphQL API',
		});
		strictEqual(result.ok, true);
		if (result.ok) ok(result.summary.includes('Corrected'));
	});

	it('asks for clarification when beliefId is missing', async () => {
		const db = await createInitializedCodexDb();
		const result = reviseBeliefToolHandler(db, { action: 'correct', claim: 'New' });
		strictEqual(result.ok, false);
		strictEqual(result.outcome, 'needs_clarification');
	});

	it('asks for clarification when claim is missing', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'Old', source: 'explicit', category: 'fact' }, { now: 1 });
		const result = reviseBeliefToolHandler(db, { action: 'correct', beliefId: 1 });
		strictEqual(result.ok, false);
		strictEqual(result.outcome, 'needs_clarification');
	});
});

describe('reviseBeliefToolHandler — merge', () => {
	it('merges beliefs into a new successor', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'A', source: 'explicit', category: 'fact' }, { now: 1 });
		remember(db, { claim: 'B', source: 'explicit', category: 'fact' }, { now: 2 });
		const result = reviseBeliefToolHandler(db, {
			action: 'merge',
			beliefIds: [1, 2],
			claim: 'A+B',
		});
		strictEqual(result.ok, true);
		if (result.ok) ok(result.summary.includes('Merged'));
	});

	it('asks for clarification when fewer than two ids', async () => {
		const db = await createInitializedCodexDb();
		const result = reviseBeliefToolHandler(db, { action: 'merge', beliefIds: [1] });
		strictEqual(result.ok, false);
		strictEqual(result.outcome, 'needs_clarification');
	});

	it('asks for clarification when beliefIds missing', async () => {
		const db = await createInitializedCodexDb();
		const result = reviseBeliefToolHandler(db, { action: 'merge' });
		strictEqual(result.ok, false);
		strictEqual(result.outcome, 'needs_clarification');
	});
});

describe('reviseBeliefToolHandler — forget', () => {
	it('forgets a belief', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'Forget me', source: 'explicit', category: 'fact' }, { now: 1 });
		const result = reviseBeliefToolHandler(db, { action: 'forget', beliefId: 1 });
		strictEqual(result.ok, true);
		ok(result.summary.includes('Forgot'));
	});

	it('forgets with directed successor', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'Old', source: 'explicit', category: 'fact' }, { now: 1 });
		remember(db, { claim: 'New', source: 'explicit', category: 'fact' }, { now: 2 });
		const result = reviseBeliefToolHandler(db, {
			action: 'forget',
			beliefId: 1,
			successorId: 2,
		});
		strictEqual(result.ok, true);
		ok(result.summary.includes('superseded'));
	});

	it('asks for clarification when beliefId is missing', async () => {
		const db = await createInitializedCodexDb();
		const result = reviseBeliefToolHandler(db, { action: 'forget' });
		strictEqual(result.ok, false);
		strictEqual(result.outcome, 'needs_clarification');
	});
});

describe('reviseBeliefToolHandler — defer', () => {
	it('defers a belief', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'Later', source: 'explicit', category: 'fact' }, { now: 1 });
		const result = reviseBeliefToolHandler(db, {
			action: 'defer',
			beliefId: 1,
			deferredUntil: 99999,
		});
		strictEqual(result.ok, true);
		ok(result.summary.includes('Deferred'));
	});

	it('asks for clarification when beliefId or deferredUntil is missing', async () => {
		const db = await createInitializedCodexDb();
		const result = reviseBeliefToolHandler(db, { action: 'defer' });
		strictEqual(result.ok, false);
		strictEqual(result.outcome, 'needs_clarification');
	});

	it('asks for clarification when only beliefId is given', async () => {
		const db = await createInitializedCodexDb();
		const result = reviseBeliefToolHandler(db, { action: 'defer', beliefId: 1 });
		strictEqual(result.ok, false);
		strictEqual(result.outcome, 'needs_clarification');
	});
});
