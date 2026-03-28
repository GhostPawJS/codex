import type { CodexDb } from '../database.ts';

export function initBeliefSearch(db: CodexDb): void {
	db.exec(`
		CREATE VIRTUAL TABLE IF NOT EXISTS beliefs_fts USING fts5(
			claim,
			content='beliefs',
			content_rowid='id',
			tokenize='porter unicode61'
		)
	`);

	db.exec(`
		CREATE TRIGGER IF NOT EXISTS beliefs_ai AFTER INSERT ON beliefs BEGIN
			INSERT INTO beliefs_fts(rowid, claim) VALUES (new.id, new.claim);
		END
	`);

	db.exec(`
		CREATE TRIGGER IF NOT EXISTS beliefs_ad AFTER DELETE ON beliefs BEGIN
			INSERT INTO beliefs_fts(beliefs_fts, rowid, claim) VALUES ('delete', old.id, old.claim);
		END
	`);

	db.exec(`
		CREATE TRIGGER IF NOT EXISTS beliefs_au AFTER UPDATE ON beliefs BEGIN
			INSERT INTO beliefs_fts(beliefs_fts, rowid, claim) VALUES ('delete', old.id, old.claim);
			INSERT INTO beliefs_fts(rowid, claim) VALUES (new.id, new.claim);
		END
	`);

	db.exec(`INSERT INTO beliefs_fts(beliefs_fts) VALUES('rebuild')`);
}
