import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getStrengthTier, mapBeliefRow } from './map_belief_row.ts';

describe('mapBeliefRow', () => {
	it('maps database rows into belief records', () => {
		const record = mapBeliefRow(
			{
				id: 1,
				claim: 'x',
				claim_normalized: 'x',
				certainty: 0.8,
				evidence: 2,
				source: 'explicit',
				category: 'fact',
				created_at: 1,
				verified_at: 1,
				superseded_by: null,
				provenance: null,
				deferred_until: null,
				embedding: new Uint8Array(),
				embedding_norm: 1,
				embedding_dim: 256,
				embedding_version: 'v1',
			},
			1,
		);
		strictEqual(record.claim, 'x');
		strictEqual(record.isActive, true);
		strictEqual(record.strength, 'strong');
		strictEqual(record.lastChangedAt, 1);
	});

	it('computes lastChangedAt as max of created_at and verified_at', () => {
		const record = mapBeliefRow(
			{
				id: 2,
				claim: 'y',
				claim_normalized: 'y',
				certainty: 0.6,
				evidence: 3,
				source: 'observed',
				category: 'preference',
				created_at: 100,
				verified_at: 500,
				superseded_by: null,
				provenance: null,
				deferred_until: null,
				embedding: new Uint8Array(),
				embedding_norm: 1,
				embedding_dim: 256,
				embedding_version: 'v1',
			},
			600,
		);
		strictEqual(record.lastChangedAt, 500);
	});

	it('derives strength tiers from certainty', () => {
		strictEqual(getStrengthTier(0.8), 'strong');
		strictEqual(getStrengthTier(0.5), 'fading');
		strictEqual(getStrengthTier(0.2), 'faint');
	});
});
