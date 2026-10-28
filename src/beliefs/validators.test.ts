import { strictEqual, throws } from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
	assertBeliefCategory,
	assertBeliefClaim,
	assertBeliefSource,
	clampCertainty,
} from './validators.ts';

describe('belief validators', () => {
	it('rejects empty claims', () => {
		throws(() => assertBeliefClaim('   '), /must not be empty/i);
	});

	it('rejects unsupported enums', () => {
		throws(() => assertBeliefSource('unknown'), /unsupported/i);
		throws(() => assertBeliefCategory('unknown'), /unsupported/i);
	});

	it('clamps certainty to the supported range', () => {
		throws(() => clampCertainty(5), /between 0 and 1/);
		strictEqual(clampCertainty(1), 0.99);
		throws(() => clampCertainty(-5), /between 0 and 1/);
		strictEqual(clampCertainty(0), 0.1);
	});
});
