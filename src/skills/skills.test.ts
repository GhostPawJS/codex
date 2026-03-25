import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { captureBeliefsWellSkill } from './index.ts';

describe('skill exports', () => {
	it('exports concrete skill stubs', () => {
		strictEqual(captureBeliefsWellSkill.name, 'capture-beliefs-well');
	});
});
