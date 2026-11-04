import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createInitializedCodexDb } from '../lib/test-db.ts';
import { recall } from './recall_beliefs.ts';
import { remember } from './remember.ts';

test('leading entities outrank other tokens, including with a prefix filter', async () => {
	const db = await createInitializedCodexDb();
	try {
		for (const claim of [
			'state files routine memory db',
			'Agentpreneur state files routine memory db guide',
			'Agentpreneur: state lives in local files',
			'Agentpreneur: preferences are explicit',
			'AGENTPRENEUR: deployment uses Tuesdays',
			'Other: routine memory db',
		])
			remember(db, { claim, source: 'explicit', category: 'fact' });
		const query = 'Agentpreneur state files routine memory db';
		for (const prefix of [undefined, 'agentpreneur']) {
			const results = recall(db, query, { prefix });
			assert.equal(results.filter((r) => /^agentpreneur:/i.test(r.claim)).length, 3);
			assert.ok(results.slice(0, 3).every((r) => /^agentpreneur:/i.test(r.claim)));
			assert.ok(results.slice(3).length > 0);
		}
		// Raw FTS continues to use its existing ranking, regardless of the first operand.
		const a = recall(db, 'Agentpreneur OR state OR files OR routine OR memory OR db', {
			fts: true,
		});
		const b = recall(db, 'state OR files OR routine OR memory OR db OR Agentpreneur', {
			fts: true,
		});
		assert.deepEqual(
			a.map((r) => r.id),
			b.map((r) => r.id),
		);
		assert.equal(
			recall(db, 'state files routine memory db')[0]?.claim,
			'state files routine memory db',
		);
	} finally {
		db.close();
	}
});

test('multiword and hyphenated entity prefixes match whole leading query tokens', async () => {
	const db = await createInitializedCodexDb();
	try {
		for (const claim of [
			'memory files routine db',
			'instagram desk: preferences',
			'instagram-desk: deployments',
		]) {
			remember(db, { claim, source: 'explicit', category: 'fact' });
		}
		for (const query of [
			'Instagram desk memory files routine db',
			'INSTAGRAM-DESK memory files routine db',
		]) {
			assert.ok(
				recall(db, query)
					.slice(0, 2)
					.every((r) => r.claim.startsWith('instagram')),
			);
			assert.equal(recall(db, query).length, 3);
		}
		assert.equal(
			recall(db, 'instagram desktop memory files routine db')[0]?.claim,
			'memory files routine db',
		);
	} finally {
		db.close();
	}
});
