import assert from 'node:assert/strict';
import { test } from 'node:test';
import { initCodexTables } from '../init_codex_tables.ts';
import { createInitializedCodexDb } from '../lib/test-db.ts';
import { reviseBeliefToolHandler } from '../tools/revise_belief_tool.ts';
import { assertActiveBeliefExists } from './assert_active_belief_exists.ts';
import { confirmBelief } from './confirm_belief.ts';
import { correctBelief } from './correct_belief.ts';
import { deferBelief } from './defer_belief.ts';
import { forgetBelief } from './forget_belief.ts';
import { getBeliefDetail } from './get_belief_detail.ts';
import { listFlags } from './list_flags.ts';
import { mergeBeliefs } from './merge_beliefs.ts';
import { recall } from './recall_beliefs.ts';
import { remember } from './remember.ts';

const day = 86400000;
test('all write paths retain append-only source references and the legacy field', async () => {
	const db = await createInitializedCodexDb();
	try {
		const add = (claim: string, provenance: string) =>
			remember(db, { claim, provenance, source: 'explicit', category: 'fact' }, { now: 1 });
		const a = add('Fox raids', 'origin');
		const duplicate = add(' FOX raids! ', 'duplicate');
		assert.equal(duplicate.id, a.id);
		assert.deepEqual(duplicate.provenanceSources, ['origin', 'duplicate']);
		assert.deepEqual(confirmBelief(db, a.id, { now: 2, provenance: 'confirm' }).provenanceSources, [
			'origin',
			'duplicate',
			'confirm',
		]);
		const corrected = correctBelief(
			db,
			a.id,
			{ claim: 'Fox tanks', provenance: 'correction' },
			{ now: 3 },
		);
		assert.deepEqual(
			new Set(corrected.provenanceSources),
			new Set(['origin', 'duplicate', 'confirm', 'correction']),
		);
		const b = add('Fox heals', 'other');
		const merged = mergeBeliefs(
			db,
			{ beliefIds: [corrected.id, b.id], claim: 'Fox plays', provenance: 'merge' },
			{ now: 4 },
		);
		const expected = new Set(['origin', 'duplicate', 'confirm', 'correction', 'other', 'merge']);
		assert.deepEqual(new Set(merged.provenanceSources), expected);
		const deferred = deferBelief(db, merged.id, 100, { now: 5, provenance: 'defer' });
		expected.add('defer');
		assert.deepEqual(new Set(deferred.provenanceSources), expected);
		const forgotten = forgetBelief(db, merged.id, { now: 6, provenance: 'forget' });
		expected.add('forget');
		assert.deepEqual(new Set(forgotten.provenanceSources), expected);
		assert.equal(forgotten.provenance, 'forget');
		const target = add('Active successor', 'target');
		const incoming = add('Incoming source', 'incoming');
		const result = mergeBeliefs(
			db,
			{ beliefIds: [incoming.id], successorId: target.id },
			{ now: 7 },
		);
		assert.deepEqual(result.provenanceSources, ['target', 'incoming']);
		assert.equal(result.provenance, null);
		assert.deepEqual(
			confirmBelief(db, target.id, { now: 8, provenance: 'incoming' }).provenanceSources,
			['target', 'incoming'],
		);
	} finally {
		db.close();
	}
});

test('successor hints resolve multiple corrections and merges, with cycles and forgotten ends bounded', async () => {
	const db = await createInitializedCodexDb();
	try {
		const a = remember(db, { claim: 'First', source: 'explicit', category: 'fact' }, { now: 1 });
		const b = correctBelief(db, a.id, { claim: 'Second' }, { now: 2 });
		const c = correctBelief(db, b.id, { claim: 'Third' }, { now: 3 });
		assert.throws(
			() => assertActiveBeliefExists(db, a.id),
			new RegExp(`superseded by ${c.id}; use ${c.id}`),
		);
		assert.equal(getBeliefDetail(db, a.id)?.activeSuccessorId, c.id);
		assert.equal(getBeliefDetail(db, a.id)?.supersededBy, b.id);
		forgetBelief(db, c.id, { now: 4 });
		assert.throws(() => assertActiveBeliefExists(db, a.id), /was not found/);
		assert.equal(getBeliefDetail(db, a.id)?.activeSuccessorId, null);
	} finally {
		db.close();
	}
});

test('same normalized correction is a no-op while metadata corrections still version', async () => {
	const db = await createInitializedCodexDb();
	try {
		const a = remember(
			db,
			{ claim: 'Fox tanks.', source: 'explicit', category: 'fact' },
			{ now: 1 },
		);
		const result = reviseBeliefToolHandler(db, {
			action: 'correct',
			beliefId: a.id,
			claim: ' FOX tanks! ',
			provenance: 'new',
		});
		assert.equal(result.outcome, 'no_op');
		assert.equal(db.prepare('SELECT COUNT(*) AS n FROM beliefs').get()?.n, 1);
		assert.deepEqual(getBeliefDetail(db, a.id)?.provenanceSources, ['new']);
		assert.notEqual(
			correctBelief(db, a.id, { claim: a.claim, category: 'procedure' }, { now: 2 }).id,
			a.id,
		);
	} finally {
		db.close();
	}
});

test('small common-term corpora return all matches and dedupe merges never become unstable', async () => {
	const db = await createInitializedCodexDb();
	try {
		const ids = Array.from(
			{ length: 6 },
			(_, i) =>
				remember(
					db,
					{ claim: `Fox Warrior talent ${i}`, source: 'explicit', category: 'fact' },
					{ now: 1 },
				).id,
		);
		assert.equal(recall(db, 'fox warrior', { now: 2 }).length, 6);
		const merged = mergeBeliefs(
			db,
			{ beliefIds: ids.slice(0, 2), claim: 'Fox Warrior combined' },
			{ now: 3 },
		);
		for (const now of [3, 8 * day, 31 * day])
			assert.equal(
				listFlags(db, now)
					.find((row) => row.id === merged.id)
					?.reasonCodes.includes('unstable') ?? false,
				false,
			);
	} finally {
		db.close();
	}
});

test('legacy duplicate migration consolidates evidence and sources once, preserves deliberate later duplicates', async () => {
	const db = await createInitializedCodexDb();
	try {
		const a = remember(
			db,
			{ claim: 'Fox raids', source: 'explicit', category: 'fact', provenance: 'one' },
			{ now: 1 },
		);
		const b = remember(
			db,
			{
				claim: ' FOX raids! ',
				source: 'explicit',
				category: 'fact',
				provenance: 'two',
				allowDuplicate: true,
			},
			{ now: 2 },
		);
		db.exec(
			'DROP TRIGGER beliefs_origin_insert; DROP TRIGGER beliefs_origin_update; ALTER TABLE beliefs DROP COLUMN provenance_sources',
		);
		initCodexTables(db);
		assert.equal(recall(db, 'fox raids').length, 1);
		assert.equal(getBeliefDetail(db, a.id)?.evidence, 2);
		assert.deepEqual(getBeliefDetail(db, a.id)?.provenanceSources, ['one', 'two']);
		assert.equal(getBeliefDetail(db, b.id)?.supersededBy, a.id);
		remember(
			db,
			{ claim: 'Fox raids', source: 'explicit', category: 'fact', allowDuplicate: true },
			{ now: 3 },
		);
		initCodexTables(db);
		assert.equal(recall(db, 'fox raids').length, 2);
		assert.equal(getBeliefDetail(db, a.id)?.evidence, 2);
	} finally {
		db.close();
	}
});
