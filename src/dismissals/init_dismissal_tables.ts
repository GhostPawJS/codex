import type { CodexDb } from '../database.ts';

export function initDismissalTables(db: CodexDb): void {
	db.exec(`
		CREATE TABLE IF NOT EXISTS dismissals (
			belief_a INTEGER NOT NULL,
			belief_b INTEGER NOT NULL,
			dismiss_count INTEGER NOT NULL DEFAULT 0,
			resurface_after INTEGER NOT NULL,
			PRIMARY KEY (belief_a, belief_b)
		)
	`);
}
