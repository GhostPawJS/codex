import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createInitializedCodexDb } from '../lib/test-db.ts';
import { rememberBeliefToolHandler } from './remember_belief_tool.ts';
import { searchCodexToolHandler } from './search_codex_tool.ts';

describe('tool handlers', () => {
	it('wrap public read/write calls', async () => {
		const db = await createInitializedCodexDb();
		rememberBeliefToolHandler(db, {
			claim: 'API uses GraphQL',
			source: 'explicit',
			category: 'fact',
		});
		const result = searchCodexToolHandler(db, { query: 'GraphQL' });
		strictEqual(result.outcome, 'success');
	});
});
