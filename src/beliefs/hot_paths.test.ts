import { strictEqual } from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { it } from 'node:test';
import * as api from '../index.ts';

// Pin outputs including correction-only trends, order, floats and tool hints.
it('preserves remember, inspect and review outputs on a mixed belief history', (t) => {
	const db = new DatabaseSync(':memory:');
	api.initCodexTables(db);
	t.mock.method(Date, 'now', () => 10000000000);
	for (const [i, source] of (
		['explicit', 'observed', 'distilled', 'inferred', 'explicit', 'observed'] as const
	).entries())
		api.write.remember(
			db,
			{
				claim: i === 5 ? 'Retired tea note' : `Mira prefers jasmine tea ${i}`,
				source,
				category: i % 2 ? 'fact' : 'preference',
				certainty: [0.9, 0.7, 0.5, 0.3, 0.2, 0.8][i],
			},
			{ now: 100 + i },
		);
	api.write.confirmBelief(db, 2, { now: 200 });
	api.write.correctBelief(db, 1, { claim: 'Mira prefers jasmine tea daily' }, { now: 300 });
	api.write.correctBelief(db, 7, { claim: 'Mira prefers jasmine tea mornings' }, { now: 400 });
	api.write.forgetBelief(db, 6, { now: 500 });
	db.prepare('INSERT INTO dismissals VALUES (?, ?, ?, ?)').run(2, 8, 1, 10000000001);
	const result = {
		flags: api.tools.reviewCodexToolHandler(db, { view: 'flags', now: 10000000000 }),
		trends: api.tools.reviewCodexToolHandler(db, { view: 'trends' }),
		remember: api.write.remember(
			db,
			{ claim: 'Mira prefers jasmine tea evenings', source: 'explicit', category: 'preference' },
			{ now: 10000000000 },
		),
		inspect: api.tools.inspectCodexItemToolHandler(db, { beliefId: 8 }),
		retired: api.tools.inspectCodexItemToolHandler(db, { beliefId: 6 }),
		status: api.tools.reviewCodexToolHandler(db, { view: 'status', now: 10000000000 }),
	};
	strictEqual(
		createHash('sha256').update(JSON.stringify(result)).digest('hex'),
		'6a0d28306983105aec1fa110459efa3ebded328f56b0c614e3f67f7e167d803e',
	);
	db.close();
});
