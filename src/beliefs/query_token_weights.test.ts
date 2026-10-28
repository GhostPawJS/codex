import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createInitializedCodexDb } from '../lib/test-db.ts';
import { forgetBelief } from './forget_belief.ts';
import { queryTokenWeights } from './query_token_weights.ts';
import { remember } from './remember.ts';

test('token weights distinguish active document frequency, unmatched terms', async () => {
	const db = await createInitializedCodexDb();
	try {
		for (const claim of ['Fox mains a Warrior', 'Fox lives in Germany', 'Fox writes TypeScript'])
			remember(db, { claim, source: 'explicit', category: 'fact' });
		for (let i = 0; i < 27; i++)
			remember(db, { claim: `Fox topic ${i}`, source: 'explicit', category: 'fact' });
		const query = queryTokenWeights(db, 'what does fox eat');
		assert.equal(query.commonOnly, true);
		assert.ok((query.weights.get('fox') ?? 1) < (query.weights.get('eat') ?? 0));
		assert.ok(query.weights.get('does') === query.weights.get('eat'));
		assert.equal(queryTokenWeights(db, 'fox warrior').commonOnly, false);
		assert.equal(queryTokenWeights(db, 'what does fox play').commonOnly, true);
		assert.equal(queryTokenWeights(db, 'zzzzzz').commonOnly, false);
		forgetBelief(db, 1);
		assert.equal(queryTokenWeights(db, 'warrior').weights.get('warrior'), Math.log(31));
	} finally {
		db.close();
	}
});
