import type { CodexDb } from '../database.ts';

import { canonicalizeBeliefPair } from './canonicalize_belief_pair.ts';
import type { DismissalRow } from './types.ts';

const DAY_MS = 24 * 60 * 60 * 1000;

export function recordDismissal(
	db: CodexDb,
	beliefA: number,
	beliefB: number,
	now: number,
	dismissBackoffDays = 7,
	dismissBackoffMax = 90,
): DismissalRow {
	const [a, b] = canonicalizeBeliefPair(beliefA, beliefB);
	const existing = db
		.prepare('SELECT * FROM dismissals WHERE belief_a = ? AND belief_b = ?')
		.get<DismissalRow>(a, b);
	const nextCount = (existing?.dismiss_count ?? 0) + 1;
	const backoffDays = Math.min(dismissBackoffMax, dismissBackoffDays * 2 ** (nextCount - 1));
	const resurfaceAfter = now + backoffDays * DAY_MS;
	db.prepare(
		`INSERT INTO dismissals (belief_a, belief_b, dismiss_count, resurface_after)
		 VALUES (?, ?, ?, ?)
		 ON CONFLICT (belief_a, belief_b)
		 DO UPDATE SET dismiss_count = excluded.dismiss_count, resurface_after = excluded.resurface_after`,
	).run(a, b, nextCount, resurfaceAfter);
	return { belief_a: a, belief_b: b, dismiss_count: nextCount, resurface_after: resurfaceAfter };
}
