import type { CodexDb } from '../database.ts';
import { collectLineageIds } from './collect_lineage_ids.ts';
import { inheritProvenance } from './inherit_provenance.ts';

export function initBeliefTables(db: CodexDb): void {
	let nested = false;
	try {
		db.exec('BEGIN IMMEDIATE');
	} catch (error) {
		if (!(error instanceof Error) || !error.message.includes('within a transaction')) throw error;
		nested = true;
		db.exec('SAVEPOINT codex_schema');
	}
	try {
		migrateBeliefTables(db);
		db.exec(nested ? 'RELEASE codex_schema' : 'COMMIT');
	} catch (error) {
		db.exec(nested ? 'ROLLBACK TO codex_schema; RELEASE codex_schema' : 'ROLLBACK');
		throw error;
	}
}

function migrateBeliefTables(db: CodexDb): void {
	db.exec(`
		CREATE TABLE IF NOT EXISTS query_aliases (
			term TEXT NOT NULL,
			alias TEXT NOT NULL,
			created_at INTEGER NOT NULL,
			PRIMARY KEY (term, alias)
		);

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
			superseded_reason TEXT,
			provenance TEXT,
			deferred_until INTEGER,
			embedding BLOB NOT NULL,
			embedding_norm REAL NOT NULL,
			embedding_dim INTEGER NOT NULL,
			embedding_version TEXT NOT NULL
		)
	`);

	if (
		!db
			.prepare('PRAGMA table_info(beliefs)')
			.all<{ name: string }>()
			.some((column) => column.name === 'superseded_reason')
	) {
		db.exec('ALTER TABLE beliefs ADD COLUMN superseded_reason TEXT');
	}

	const migrate = !db
		.prepare('PRAGMA table_info(beliefs)')
		.all<{ name: string }>()
		.some((column) => column.name === 'provenance_sources');
	if (migrate)
		db.exec("ALTER TABLE beliefs ADD COLUMN provenance_sources TEXT NOT NULL DEFAULT '[]'");
	db.exec(`
		CREATE TRIGGER IF NOT EXISTS beliefs_origin_insert AFTER INSERT ON beliefs
		WHEN new.provenance IS NOT NULL BEGIN
			UPDATE beliefs SET provenance_sources = json_array(new.provenance) WHERE id = new.id;
		END;
		CREATE TRIGGER IF NOT EXISTS beliefs_origin_update AFTER UPDATE OF provenance ON beliefs
		WHEN new.provenance IS NOT NULL AND NOT EXISTS
			(SELECT 1 FROM json_each(new.provenance_sources) WHERE value = new.provenance) BEGIN
			UPDATE beliefs SET provenance_sources = json_insert(new.provenance_sources, '$[#]', new.provenance) WHERE id = new.id;
		END;
	`);
	if (migrate) {
		db.exec('UPDATE beliefs SET provenance = provenance');
		// Consolidate legacy duplicates once; later explicit allowDuplicate writes remain independent.
		const duplicates = db
			.prepare(`SELECT claim_normalized FROM beliefs WHERE superseded_by IS NULL
			GROUP BY claim_normalized HAVING COUNT(*) > 1`)
			.all<{ claim_normalized: string }>();
		for (const { claim_normalized } of duplicates) {
			const rows = db
				.prepare(
					'SELECT id, evidence FROM beliefs WHERE claim_normalized = ? AND superseded_by IS NULL ORDER BY id',
				)
				.all<{ id: number; evidence: number }>(claim_normalized);
			const first = rows[0];
			if (!first) continue;
			for (const row of rows.slice(1)) {
				inheritProvenance(db, first.id, [row.id]);
				db.prepare(
					"UPDATE beliefs SET superseded_by = ?, superseded_reason = 'merged' WHERE id = ?",
				).run(first.id, row.id);
			}
			db.prepare('UPDATE beliefs SET evidence = ? WHERE id = ?').run(
				rows.reduce((sum, row) => sum + row.evidence, 0),
				first.id,
			);
		}
		for (const { id } of db
			.prepare('SELECT id FROM beliefs WHERE superseded_by IS NULL')
			.all<{ id: number }>()) {
			inheritProvenance(db, id, collectLineageIds(db, id));
		}
	}

	db.exec('CREATE INDEX IF NOT EXISTS beliefs_active_idx ON beliefs (superseded_by)');
	db.exec('CREATE INDEX IF NOT EXISTS beliefs_verified_idx ON beliefs (verified_at DESC)');
	db.exec('CREATE INDEX IF NOT EXISTS beliefs_category_idx ON beliefs (category)');
	db.exec('CREATE INDEX IF NOT EXISTS beliefs_source_idx ON beliefs (source)');
}
