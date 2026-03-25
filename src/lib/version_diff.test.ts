import { deepStrictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { computeVersionDiff } from './version_diff.ts';

describe('computeVersionDiff', () => {
	it('returns the before and after claim pair', () => {
		deepStrictEqual(computeVersionDiff('old', 'new'), { before: 'old', after: 'new' });
	});
});
