import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createInitializedCodexDb } from '../lib/test-db.ts';
import { searchCodexToolHandler } from '../tools/search_codex_tool.ts';
import { confirmBelief } from './confirm_belief.ts';
import { correctBelief } from './correct_belief.ts';
import { deferBelief } from './defer_belief.ts';
import { forgetBelief } from './forget_belief.ts';
import { FLAG_GRACE_MS, listFlags } from './list_flags.ts';
import { listLog } from './list_log.ts';
import { mergeBeliefs } from './merge_beliefs.ts';
import { recall } from './recall_beliefs.ts';
import { remember } from './remember.ts';

test('varied corpus rejects unrelated queries and seeded nonwords, rescues token typos', async () => {
	const db = await createInitializedCodexDb();
	try {
		const topics = [
			'warrior shield battle',
			'coffee roast beans',
			'database sqlite storage',
			'garden flower soil',
			'travel train station',
			'music piano concert',
		];
		for (let i = 0; i < 36; i++)
			remember(
				db,
				{
					claim: `Fox ${topics[i % topics.length]} record ${i}`,
					source: 'explicit',
					category: 'fact',
				},
				{ now: 1 },
			);
		for (const query of ['zebra', 'quantum chromodynamics']) {
			assert.deepEqual(recall(db, query, { now: 2 }), []);
			const result = searchCodexToolHandler(db, { query });
			assert.deepEqual(result.warnings, [
				{ code: 'no_match', message: 'No belief matches the query terms.' },
			]);
		}
		assert.equal(recall(db, 'warior', { now: 2 }).length, 6);
		const result = searchCodexToolHandler(db, { query: 'fox warrior' });
		assert.equal(result.ok, true);
		if (result.ok) {
			assert.equal(result.data.results.length, 6);
			assert.ok(result.data.results.every((r) => r.claim.includes('warrior')));
		}
		assert.equal(result.warnings, undefined);
		assert.equal(recall(db, 'fox', { now: 2 }).length, 3);
		let seed = 81273;
		for (let i = 0; i < 100; i++) {
			let query = '';
			for (let j = 0; j < 16; j++) {
				seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
				query += String.fromCharCode(97 + (seed % 26));
			}
			assert.deepEqual(recall(db, query, { now: 2 }), [], query);
		}
	} finally {
		db.close();
	}
});

test('duplicate normalization, opt-out, inactive rows and provenance lineage', async () => {
	const db = await createInitializedCodexDb();
	try {
		const a = remember(
			db,
			{ claim: 'Fox likes coffee.', source: 'explicit', category: 'fact', provenance: 'chat:1' },
			{ now: 1 },
		);
		assert.equal(
			remember(
				db,
				{ claim: ' FOX likes coffee! ', source: 'observed', category: 'fact' },
				{ now: 2 },
			).id,
			a.id,
		);
		const b = remember(
			db,
			{
				claim: a.claim,
				source: 'explicit',
				category: 'fact',
				provenance: 'chat:1',
				allowDuplicate: true,
			},
			{ now: 2 },
		);
		assert.notEqual(a.id, b.id);
		const merged = mergeBeliefs(
			db,
			{ beliefIds: [a.id, b.id], claim: 'Fox enjoys coffee' },
			{ now: 3 },
		);
		assert.equal(merged.provenance, 'chat:1');
		assert.deepEqual(listFlags(db, 3), []);
		assert.ok(
			listFlags(db, 3 + FLAG_GRACE_MS).some(
				(r) => r.id === merged.id && r.reasonCodes.includes('unstable'),
			),
		);
		assert.throws(
			() => correctBelief(db, a.id, { claim: 'changed' }),
			new RegExp(`superseded by ${merged.id}; use ${merged.id}`),
		);
		const corrected = correctBelief(db, merged.id, { claim: 'Fox enjoys tea' }, { now: 4 });
		assert.equal(corrected.provenance, 'chat:1');
		assert.equal(confirmBelief(db, corrected.id, { now: 5 }).provenance, 'chat:1');
		assert.equal(
			confirmBelief(db, corrected.id, { now: 6, provenance: 'chat:2' }).provenance,
			'chat:2',
		);
		const explicit = correctBelief(
			db,
			corrected.id,
			{ claim: 'Fox enjoys water', provenance: 'chat:3' },
			{ now: 7 },
		);
		assert.equal(explicit.provenance, 'chat:3');
		const other = remember(
			db,
			{ claim: 'Fox enjoys juice', source: 'inferred', category: 'fact', provenance: 'other' },
			{ now: 8 },
		);
		assert.equal(other.strength, 'strong');
		const mixed = mergeBeliefs(
			db,
			{ beliefIds: [explicit.id, other.id], claim: 'Fox enjoys drinks' },
			{ now: 9 },
		);
		assert.equal(mixed.provenance, null);
		deferBelief(db, mixed.id, 1000, { now: 10 });
		assert.equal(listLog(db)[0]?.type, 'deferred');
		assert.equal(listLog(db)[0]?.at, 10);
		assert.notEqual(
			remember(db, { claim: a.claim, source: 'explicit', category: 'fact' }, { now: 11 }).id,
			a.id,
		);
	} finally {
		db.close();
	}
});

test('merge provenance agrees, differs or is explicitly replaced with an existing successor', async () => {
	const db = await createInitializedCodexDb();
	try {
		const add = (claim: string, provenance: string) =>
			remember(db, { claim, provenance, source: 'explicit', category: 'fact' }, { now: 1 });
		const a = add('First origin', 'same'),
			b = add('Second origin', 'same');
		assert.equal(
			mergeBeliefs(db, { beliefIds: [a.id], successorId: b.id }, { now: 2 }).provenance,
			'same',
		);
		const c = add('Different origin', 'different');
		assert.equal(
			mergeBeliefs(db, { beliefIds: [c.id], successorId: b.id }, { now: 3 }).provenance,
			null,
		);
		const d = add('Explicit origin', 'another');
		assert.equal(
			mergeBeliefs(db, { beliefIds: [d.id], successorId: b.id, provenance: 'override' }, { now: 4 })
				.provenance,
			'override',
		);
		const e = add('New primary', 'one'),
			f = add('New secondary', 'two');
		assert.equal(
			mergeBeliefs(
				db,
				{ beliefIds: [e.id, f.id], claim: 'Combined origins', provenance: 'combined' },
				{ now: 5 },
			).provenance,
			'combined',
		);
	} finally {
		db.close();
	}
});

test('log sorts by last change and moderate strength fades only after decay', async () => {
	const db = await createInitializedCodexDb();
	try {
		const early = remember(
			db,
			{ claim: 'Early belief', source: 'inferred', category: 'fact' },
			{ now: 1 },
		);
		const later = remember(
			db,
			{ claim: 'Later belief', source: 'inferred', category: 'fact' },
			{ now: 20 },
		);
		assert.equal(early.strength, 'strong');
		db.prepare('UPDATE beliefs SET verified_at = ? WHERE id = ?').run(10, early.id);
		db.prepare('UPDATE beliefs SET verified_at = ? WHERE id = ?').run(1, later.id);
		assert.equal(listLog(db)[0]?.id, later.id);
		assert.equal(recall(db, 'early', { now: 90 * 24 * 60 * 60 * 1000 })[0]?.strength, 'fading');
	} finally {
		db.close();
	}
});

test('historical lexical matches do not block active token spelling rescue', async () => {
	const db = await createInitializedCodexDb();
	try {
		const active = remember(
			db,
			{ claim: 'A warrior carries a shield', source: 'explicit', category: 'fact' },
			{ now: 1 },
		);
		const historical = remember(
			db,
			{ claim: 'A warior carries a spear', source: 'explicit', category: 'fact' },
			{ now: 2 },
		);
		forgetBelief(db, historical.id, { now: 3 });
		assert.equal(recall(db, 'warior', { now: 4 })[0]?.id, active.id);
	} finally {
		db.close();
	}
});
