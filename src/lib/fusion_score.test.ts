import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { computeFusionScore } from './fusion_score.ts';

describe('computeFusionScore', () => {
	it('rewards better ranks', () => {
		const better = computeFusionScore({ lexicalRank: 1, semanticRank: 1, recallWeight: 1 });
		const worse = computeFusionScore({ lexicalRank: 10, semanticRank: 10, recallWeight: 1 });
		strictEqual(better.combined > worse.combined, true);
	});
});
