import { ok, strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { correctBelief } from '../beliefs/correct_belief.ts';
import { forgetBelief } from '../beliefs/forget_belief.ts';
import { remember } from '../beliefs/remember.ts';
import { createInitializedCodexDb } from '../lib/test-db.ts';
import { inspectCodexItemTool, inspectCodexItemToolHandler } from './inspect_codex_item_tool.ts';

describe('inspectCodexItemTool', () => {
	it('has correct name and metadata', () => {
		strictEqual(inspectCodexItemTool.name, 'inspect_codex_item');
		strictEqual(inspectCodexItemTool.readOnly, true);
		strictEqual(inspectCodexItemTool.sideEffects, 'none');
		strictEqual(typeof inspectCodexItemTool.whenToUse, 'string');
	});
});

describe('inspectCodexItemToolHandler', () => {
	it('returns detail and lineage for existing belief', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'REST API', source: 'explicit', category: 'fact' }, { now: 1 });
		const result = inspectCodexItemToolHandler(db, { beliefId: 1 });
		strictEqual(result.ok, true);
		if (result.ok) {
			strictEqual(result.data.detail.claim, 'REST API');
			strictEqual(result.data.lineage.length, 1);
			strictEqual(result.entities.length >= 1, true);
		}
	});

	it('returns not_found error for missing belief', async () => {
		const db = await createInitializedCodexDb();
		const result = inspectCodexItemToolHandler(db, { beliefId: 999 });
		strictEqual(result.ok, false);
		if (!result.ok && result.outcome === 'error') {
			strictEqual(result.error.code, 'not_found');
		}
	});

	it('provides revise hints for active beliefs', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'Active one', source: 'explicit', category: 'fact' }, { now: 1 });
		const result = inspectCodexItemToolHandler(db, { beliefId: 1 });
		strictEqual(result.ok, true);
		if (result.ok) {
			ok(result.next?.some((n) => n.tool === 'revise_belief'));
		}
	});

	it('handles superseded beliefs without revise hints', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'Old', source: 'explicit', category: 'fact' }, { now: 1 });
		forgetBelief(db, 1, { now: 2 });
		const result = inspectCodexItemToolHandler(db, { beliefId: 1 });
		strictEqual(result.ok, true);
		if (result.ok) {
			ok(result.summary.includes('superseded'));
		}
	});

	it('includes lineage for corrected beliefs', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'V1', source: 'explicit', category: 'fact' }, { now: 1 });
		correctBelief(db, 1, { claim: 'V2' }, { now: 2 });
		const result = inspectCodexItemToolHandler(db, { beliefId: 2 });
		strictEqual(result.ok, true);
		if (result.ok) {
			strictEqual(result.data.lineage.length, 2);
		}
	});

	it('includes dismiss hints for proximity matches', async () => {
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
		const result = inspectCodexItemToolHandler(db, { beliefId: 1 });
		strictEqual(result.ok, true);
		if (result.ok && result.data.detail.proximity.length > 0) {
			ok(result.next?.some((n) => n.tool === 'dismiss_proximity'));
		}
	});
});
