import type { WriteOptions } from '../beliefs/types.ts';
import type { CodexDb } from '../database.ts';
import { resolveNow } from '../resolve_now.ts';

import { recordDismissal } from './record_dismissal.ts';
import type { DismissalRecord } from './types.ts';

export function dismissProximityPair(
	db: CodexDb,
	beliefA: number,
	beliefB: number,
	options?: WriteOptions,
): DismissalRecord {
	const row = recordDismissal(db, beliefA, beliefB, resolveNow(options?.now));
	return {
		beliefA: row.belief_a,
		beliefB: row.belief_b,
		dismissCount: row.dismiss_count,
		resurfaceAfter: row.resurface_after,
	};
}
