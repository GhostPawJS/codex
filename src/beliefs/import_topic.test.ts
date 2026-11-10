import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createInitializedCodexDb } from '../lib/test-db.ts';
import { importBeliefsToolHandler } from '../tools/import_beliefs_tool.ts';
import { correctBelief } from './correct_belief.ts';
import { importBeliefs, parseBeliefImport } from './import_beliefs.ts';
import { initBeliefTables } from './init_belief_tables.ts';
import { listBeliefs } from './list_beliefs.ts';
import { recall } from './recall_beliefs.ts';
import { remember } from './remember.ts';

const input = {
	claim: 'Deploy on Tuesdays',
	source: 'explicit' as const,
	category: 'procedure' as const,
};
test('topic migrates idempotently, is omitted when unset, survives correction and filters list/search', async () => {
	const db = await createInitializedCodexDb();
	try {
		// Simulate the immediately preceding schema, with existing data and search triggers.
		remember(db, input);
		db.exec('DROP INDEX beliefs_topic_idx; ALTER TABLE beliefs DROP COLUMN topic');
		initBeliefTables(db);
		initBeliefTables(db);
		const old = listBeliefs(db)[0];
		assert.ok(old);
		assert.equal(Object.hasOwn(old, 'topic'), false);
		assert.equal(JSON.stringify(old).includes('"topic"'), false);
		const tagged = remember(db, { ...input, claim: 'Deploy on Wednesdays', topic: 'work' });
		const other = remember(db, { ...input, claim: 'Deploy on Thursdays', topic: 'personal' });
		assert.deepEqual(
			listBeliefs(db, { topic: 'work' }).map((b) => b.id),
			[tagged.id],
		);
		assert.deepEqual(
			recall(db, 'Deploy', { topic: 'personal' }).map((b) => b.id),
			[other.id],
		);
		const corrected = correctBelief(db, tagged.id, { claim: 'Deploy on Fridays' });
		assert.equal(corrected.topic, 'work');
		const changed = correctBelief(db, corrected.id, { claim: corrected.claim, topic: 'release' });
		assert.notEqual(changed.id, corrected.id);
		assert.equal(changed.topic, 'release');
		assert.throws(() => remember(db, { ...input, topic: ' ' }), /Topic/);
	} finally {
		db.close();
	}
});
test('atomic import returns every item, rolls back duplicates/provenance on error, and dry runs persist nothing', async () => {
	const db = await createInitializedCodexDb();
	try {
		const initial = remember(db, { ...input, provenance: 'original' });
		const before = db.prepare('SELECT * FROM beliefs ORDER BY id').all();
		const failed = importBeliefs(db, [
			{ ...input, provenance: 'new', topic: 'changed' },
			{ ...input, claim: '' },
			{ ...input, claim: 'Another claim' },
		]);
		assert.equal(failed.committed, false);
		assert.equal(failed.items.length, 3);
		assert.match(failed.items[1]?.error ?? '', /empty/);
		assert.ok(failed.items.every((item) => item.error && item.id === undefined));
		assert.deepEqual(db.prepare('SELECT * FROM beliefs ORDER BY id').all(), before);
		const dry = importBeliefs(db, [{ ...input, claim: 'Dry claim', topic: 'work' }], {
			dryRun: true,
		});
		assert.equal(dry.committed, false);
		assert.equal(dry.dryRun, true);
		assert.ok(dry.items[0]?.id);
		assert.deepEqual(db.prepare('SELECT * FROM beliefs ORDER BY id').all(), before);
		const done = importBeliefs(db, [input, { ...input, claim: 'New claim', topic: 'work' }]);
		assert.equal(done.committed, true);
		assert.equal(done.items[0]?.id, initial.id);
		assert.equal(done.items[0]?.duplicate, true);
		assert.equal(listBeliefs(db).length, 2);
		const tool = importBeliefsToolHandler(db, {
			items: [
				{ ...input, claim: 'Valid' },
				{ ...input, category: 'wrong' as 'fact' },
			],
		});
		assert.equal(tool.ok, false);
		if (tool.outcome === 'error') assert.equal((tool.error.details?.items as unknown[]).length, 2);
		assert.equal(listBeliefs(db).length, 2);
	} finally {
		db.close();
	}
});
test('JSON arrays and JSON Lines parse with useful syntax errors', () => {
	assert.deepEqual(parseBeliefImport(JSON.stringify([input])), [input]);
	assert.deepEqual(parseBeliefImport(`\n${JSON.stringify(input)}\n\n${JSON.stringify(input)}\n`), [
		input,
		input,
	]);
	assert.deepEqual(parseBeliefImport(''), []);
	assert.throws(() => parseBeliefImport(`${JSON.stringify(input)}\ninvalid`), /line 2/);
});
