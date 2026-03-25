import { ok, strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { correctBelief } from '../beliefs/correct_belief.ts';
import { remember } from '../beliefs/remember.ts';
import { createInitializedCodexDb } from '../lib/test-db.ts';
import { retireBeliefTool, retireBeliefToolHandler } from './retire_belief_tool.ts';

describe('retireBeliefTool', () => {
	it('has correct name and metadata', () => {
		strictEqual(retireBeliefTool.name, 'retire_belief');
		strictEqual(retireBeliefTool.readOnly, false);
		strictEqual(retireBeliefTool.sideEffects, 'writes_state');
		strictEqual(typeof retireBeliefTool.whenToUse, 'string');
		strictEqual(typeof retireBeliefTool.whenNotToUse, 'string');
	});
});

describe('retireBeliefToolHandler', () => {
	it('deletes a belief and its lineage', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'Delete me', source: 'explicit', category: 'fact' }, { now: 1 });
		const result = retireBeliefToolHandler(db, { beliefId: 1 });
		strictEqual(result.ok, true);
		if (result.ok) {
			strictEqual(result.data.deletedIds.length, 1);
			ok(result.next?.some((n) => n.kind === 'review_view'));
		}
	});

	it('deletes entire lineage chain', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'V1', source: 'explicit', category: 'fact' }, { now: 1 });
		correctBelief(db, 1, { claim: 'V2' }, { now: 2 });
		const result = retireBeliefToolHandler(db, { beliefId: 1 });
		strictEqual(result.ok, true);
		if (result.ok) strictEqual(result.data.deletedIds.length, 2);
	});

	it('handles nonexistent belief gracefully with warning', async () => {
		const db = await createInitializedCodexDb();
		const result = retireBeliefToolHandler(db, { beliefId: 999 });
		strictEqual(result.ok, true);
		if (result.ok) {
			strictEqual(result.data.deletedIds.length, 0);
			ok(result.warnings?.some((w) => w.code === 'empty_result'));
		}
	});
});
