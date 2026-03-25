import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { openTestDatabase } from '../lib/open-test-database.ts';
import { getActiveBeliefRow } from './get_active_belief_row.ts';
import { initBeliefTables } from './init_belief_tables.ts';

describe('getActiveBeliefRow', () => {
	it('returns only unsuperseded beliefs', async () => {
		const db = await openTestDatabase();
		initBeliefTables(db);
		db.prepare(`INSERT INTO beliefs (
			claim, claim_normalized, certainty, evidence, source, category, created_at, verified_at,
			superseded_by, provenance, deferred_until, embedding, embedding_norm, embedding_dim, embedding_version
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
			'x',
			'x',
			0.9,
			1,
			'explicit',
			'fact',
			1,
			1,
			null,
			null,
			null,
			new Uint8Array(4),
			1,
			1,
			'v1',
		);
		strictEqual(getActiveBeliefRow(db, 1)?.id, 1);
		db.prepare('UPDATE beliefs SET superseded_by = 1 WHERE id = 1').run();
		strictEqual(getActiveBeliefRow(db, 1), null);
	});
});
