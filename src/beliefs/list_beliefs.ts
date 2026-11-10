import type { CodexDb } from '../database.ts';
import { resolveNow } from '../resolve_now.ts';
import { mapBeliefRow } from './map_belief_row.ts';
import type { BeliefRecord, BeliefRow } from './types.ts';

/** List active beliefs by id with an optional exact topic filter. */
export function listBeliefs(
	db: CodexDb,
	options: { topic?: string; limit?: number; now?: number } = {},
): BeliefRecord[] {
	const rows =
		options.topic === undefined
			? db
					.prepare('SELECT * FROM beliefs WHERE superseded_by IS NULL ORDER BY id LIMIT ?')
					.all<BeliefRow>(options.limit ?? 20)
			: db
					.prepare(
						'SELECT * FROM beliefs WHERE superseded_by IS NULL AND topic = ? ORDER BY id LIMIT ?',
					)
					.all<BeliefRow>(options.topic, options.limit ?? 20);
	const now = resolveNow(options.now);
	return rows.map((row) => mapBeliefRow(row, now));
}
