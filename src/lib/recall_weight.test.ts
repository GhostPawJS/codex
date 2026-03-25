import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { computeEvidenceFloor, computeRecallWeight } from './recall_weight.ts';

describe('recall weight helpers', () => {
	it('raises the evidence floor with more evidence', () => {
		strictEqual(computeEvidenceFloor(10) > computeEvidenceFloor(1), true);
	});

	it('uses the larger of freshness and evidence floor', () => {
		const weight = computeRecallWeight(0.8, 0.2, 10);
		strictEqual(weight > 0.2, true);
	});
});
