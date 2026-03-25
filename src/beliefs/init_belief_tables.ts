import type { CodexDb } from '../database.ts';

export function initBeliefTables(db: CodexDb): void {
	db.exec(`
		CREATE TABLE IF NOT EXISTS beliefs (
			id INTEGER PRIMARY KEY,
			claim TEXT NOT NULL,
			claim_normalized TEXT NOT NULL,
			certainty REAL NOT NULL CHECK (certainty >= 0 AND certainty <= 1),
			evidence INTEGER NOT NULL CHECK (evidence >= 1),
			source TEXT NOT NULL CHECK (source IN ('explicit', 'observed', 'distilled', 'inferred')),
			category TEXT NOT NULL CHECK (category IN ('preference', 'fact', 'procedure', 'capability', 'custom')),
			created_at INTEGER NOT NULL,
			verified_at INTEGER NOT NULL,
			superseded_by INTEGER REFERENCES beliefs(id),
			provenance TEXT,
			deferred_until INTEGER,
			embedding BLOB NOT NULL,
			embedding_norm REAL NOT NULL,
			embedding_dim INTEGER NOT NULL,
			embedding_version TEXT NOT NULL
		)
	`);

	db.exec('CREATE INDEX IF NOT EXISTS beliefs_active_idx ON beliefs (superseded_by)');
	db.exec('CREATE INDEX IF NOT EXISTS beliefs_verified_idx ON beliefs (verified_at DESC)');
	db.exec('CREATE INDEX IF NOT EXISTS beliefs_category_idx ON beliefs (category)');
	db.exec('CREATE INDEX IF NOT EXISTS beliefs_source_idx ON beliefs (source)');
}
