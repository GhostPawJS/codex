import type { CodexDb } from '../database.ts';

import { canonicalizeBeliefPair } from './canonicalize_belief_pair.ts';
import type { DismissalRow } from './types.ts';

export function isPairDismissed(
	db: CodexDb,
	beliefA: number,
	beliefB: number,
	now: number,
): boolean {
	const [a, b] = canonicalizeBeliefPair(beliefA, beliefB);
	const row = db
		.prepare('SELECT * FROM dismissals WHERE belief_a = ? AND belief_b = ?')
		.get<DismissalRow>(a, b);
	return row !== undefined && row.resurface_after > now;
}
