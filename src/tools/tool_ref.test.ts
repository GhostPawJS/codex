import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { BeliefRecord } from '../beliefs/types.ts';
import type { DismissalRecord } from '../dismissals/types.ts';
import { toBeliefIdRef, toBeliefRef, toDismissalRef } from './tool_ref.ts';

const stubBeliefRecord: BeliefRecord = {
	id: 5,
	claim: 'TypeScript is good',
	claimNormalized: 'typescript is good',
	certainty: 0.9,
	evidence: 3,
	source: 'explicit',
	category: 'preference',
	createdAt: 100,
	verifiedAt: 200,
	supersededBy: null,
	provenance: null,
	deferredUntil: null,
	freshness: 0.95,
	strength: 'strong',
	isActive: true,
	lastChangedAt: 200,
};

const stubDismissalRecord: DismissalRecord = {
	beliefA: 3,
	beliefB: 7,
	dismissCount: 2,
	resurfaceAfter: 99999,
};

describe('toBeliefRef', () => {
	it('creates a belief entity ref from a record', () => {
		const ref = toBeliefRef(stubBeliefRecord);
		strictEqual(ref.kind, 'belief');
		strictEqual(ref.id, 5);
		strictEqual(ref.title, 'TypeScript is good');
	});
});

describe('toBeliefIdRef', () => {
	it('creates a belief entity ref from an id and optional claim', () => {
		const ref = toBeliefIdRef(42, 'Some claim');
		strictEqual(ref.kind, 'belief');
		strictEqual(ref.id, 42);
		strictEqual(ref.title, 'Some claim');
	});

	it('works without a claim', () => {
		const ref = toBeliefIdRef(10);
		strictEqual(ref.kind, 'belief');
		strictEqual(ref.id, 10);
		strictEqual(ref.title, undefined);
	});
});

describe('toDismissalRef', () => {
	it('creates a dismissal entity ref with canonical pair title', () => {
		const ref = toDismissalRef(stubDismissalRecord);
		strictEqual(ref.kind, 'dismissal');
		strictEqual(ref.id, 3);
		strictEqual(ref.title, '3↔7');
	});
});
