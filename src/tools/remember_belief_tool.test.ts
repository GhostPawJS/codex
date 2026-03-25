import { ok, strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { remember } from '../beliefs/remember.ts';
import { createInitializedCodexDb } from '../lib/test-db.ts';
import { rememberBeliefTool, rememberBeliefToolHandler } from './remember_belief_tool.ts';

describe('rememberBeliefTool', () => {
	it('has correct name and metadata', () => {
		strictEqual(rememberBeliefTool.name, 'remember_belief');
		strictEqual(rememberBeliefTool.readOnly, false);
		strictEqual(rememberBeliefTool.sideEffects, 'writes_state');
		strictEqual(typeof rememberBeliefTool.whenToUse, 'string');
		strictEqual(typeof rememberBeliefTool.whenNotToUse, 'string');
	});
});

describe('rememberBeliefToolHandler', () => {
	it('captures a belief and returns entity ref', async () => {
		const db = await createInitializedCodexDb();
		const result = rememberBeliefToolHandler(db, {
			claim: 'TypeScript rocks',
			source: 'explicit',
			category: 'preference',
		});
		strictEqual(result.ok, true);
		if (result.ok) {
			strictEqual(result.entities.length >= 1, true);
			strictEqual(result.entities[0]?.kind, 'belief');
			strictEqual(result.data.belief.claim, 'TypeScript rocks');
		}
	});

	it('includes search hint for overlap checking', async () => {
		const db = await createInitializedCodexDb();
		const result = rememberBeliefToolHandler(db, {
			claim: 'New belief',
			source: 'explicit',
			category: 'fact',
		});
		strictEqual(result.ok, true);
		if (result.ok) {
			ok(result.next?.some((n) => n.tool === 'search_codex'));
		}
	});

	it('warns about nearby beliefs and provides dismiss hints', async () => {
		const db = await createInitializedCodexDb();
		remember(
			db,
			{ claim: 'The API uses GraphQL', source: 'explicit', category: 'fact' },
			{ now: 1 },
		);
		const result = rememberBeliefToolHandler(db, {
			claim: 'GraphQL powers the API',
			source: 'observed',
			category: 'fact',
		});
		strictEqual(result.ok, true);
		if (result.ok && (result.warnings?.length ?? 0) > 0) {
			ok(result.warnings?.some((w) => w.code === 'partial_match'));
			ok(result.next?.some((n) => n.tool === 'dismiss_proximity'));
		}
	});

	it('returns structured error for invalid source', async () => {
		const db = await createInitializedCodexDb();
		const result = rememberBeliefToolHandler(db, {
			claim: 'Test',
			source: 'bogus' as 'explicit',
			category: 'fact',
		});
		strictEqual(result.ok, false);
		if (!result.ok && result.outcome === 'error') {
			strictEqual(result.error.code, 'invalid_input');
		}
	});

	it('returns structured error for invalid category', async () => {
		const db = await createInitializedCodexDb();
		const result = rememberBeliefToolHandler(db, {
			claim: 'Test',
			source: 'explicit',
			category: 'wrong' as 'fact',
		});
		strictEqual(result.ok, false);
		if (!result.ok && result.outcome === 'error') {
			strictEqual(result.error.code, 'invalid_input');
		}
	});

	it('returns structured error for empty claim', async () => {
		const db = await createInitializedCodexDb();
		const result = rememberBeliefToolHandler(db, {
			claim: '   ',
			source: 'explicit',
			category: 'fact',
		});
		strictEqual(result.ok, false);
		if (!result.ok && result.outcome === 'error') {
			strictEqual(result.error.code, 'invalid_input');
		}
	});
});
