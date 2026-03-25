import { ok, strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createInitializedCodexDb } from '../lib/test-db.ts';
import { dismissProximityTool, dismissProximityToolHandler } from './dismiss_proximity_tool.ts';

describe('dismissProximityTool', () => {
	it('has correct name and metadata', () => {
		strictEqual(dismissProximityTool.name, 'dismiss_proximity');
		strictEqual(dismissProximityTool.readOnly, false);
		strictEqual(dismissProximityTool.sideEffects, 'writes_state');
		strictEqual(typeof dismissProximityTool.whenToUse, 'string');
		strictEqual(typeof dismissProximityTool.whenNotToUse, 'string');
	});
});

describe('dismissProximityToolHandler', () => {
	it('dismisses a pair and returns backoff state', async () => {
		const db = await createInitializedCodexDb();
		const result = dismissProximityToolHandler(db, { beliefA: 1, beliefB: 2 });
		strictEqual(result.ok, true);
		if (result.ok) {
			strictEqual(result.data.dismissal.dismissCount, 1);
			strictEqual(result.entities.length >= 1, true);
			strictEqual(result.entities[0]?.kind, 'dismissal');
		}
	});

	it('increments count on repeated dismissals', async () => {
		const db = await createInitializedCodexDb();
		dismissProximityToolHandler(db, { beliefA: 1, beliefB: 2 });
		const result = dismissProximityToolHandler(db, { beliefA: 1, beliefB: 2 });
		strictEqual(result.ok, true);
		if (result.ok) strictEqual(result.data.dismissal.dismissCount, 2);
	});

	it('returns error for same-id pair', async () => {
		const db = await createInitializedCodexDb();
		const result = dismissProximityToolHandler(db, { beliefA: 1, beliefB: 1 });
		strictEqual(result.ok, false);
		if (!result.ok && result.outcome === 'error') {
			strictEqual(result.error.kind, 'system');
		}
	});

	it('canonicalizes pair order', async () => {
		const db = await createInitializedCodexDb();
		const result = dismissProximityToolHandler(db, { beliefA: 5, beliefB: 3 });
		strictEqual(result.ok, true);
		if (result.ok) {
			strictEqual(result.data.dismissal.beliefA, 3);
			strictEqual(result.data.dismissal.beliefB, 5);
		}
	});

	it('provides review hint after dismissal', async () => {
		const db = await createInitializedCodexDb();
		const result = dismissProximityToolHandler(db, { beliefA: 1, beliefB: 2 });
		strictEqual(result.ok, true);
		if (result.ok) {
			ok(result.next?.some((n) => n.kind === 'review_view'));
		}
	});
});
