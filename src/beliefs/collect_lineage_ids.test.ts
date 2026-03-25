import { deepStrictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { openTestDatabase } from '../lib/open-test-database.ts';
import { collectLineageIds } from './collect_lineage_ids.ts';
import { initBeliefTables } from './init_belief_tables.ts';

describe('collectLineageIds', () => {
	it('collects predecessor and successor ids in a lineage component', async () => {
		const db = await openTestDatabase();
		initBeliefTables(db);
		const insert = db.prepare(`INSERT INTO beliefs (
			id, claim, claim_normalized, certainty, evidence, source, category, created_at, verified_at,
			superseded_by, provenance, deferred_until, embedding, embedding_norm, embedding_dim, embedding_version
		) VALUES (?, 'x', 'x', 0.9, 1, 'explicit', 'fact', 1, 1, ?, null, null, ?, 1, 1, 'v1')`);
		insert.run(3, null, new Uint8Array(4));
		insert.run(2, 3, new Uint8Array(4));
		insert.run(1, 2, new Uint8Array(4));
		deepStrictEqual(collectLineageIds(db, 2), [1, 2, 3]);
	});
});
