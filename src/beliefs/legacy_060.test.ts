import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import type { CodexDb } from '../database.ts';
import { initCodexTables } from '../init_codex_tables.ts';
import { openCodexDb } from '../surface/open_codex_db.ts';
import { correctBelief } from './correct_belief.ts';
import { initLegacy060 } from './fixtures/legacy_060.ts';
import { prepareBeliefStorage } from './prepare_belief_storage.ts';

for (const provenance of [undefined, 'updated-src']) {
	test(`corrects v0.6.0 provenance beliefs after migration (${provenance ?? 'inherited'})`, async () => {
		const directory = mkdtempSync(join(tmpdir(), 'codex-060-'));
		const path = join(directory, 'legacy.db');
		try {
			const legacy = new DatabaseSync(path) as unknown as CodexDb;
			initLegacy060(legacy);
			for (const claim of ['legacy alpha', 'legacy beta', 'legacy gamma']) {
				const prepared = prepareBeliefStorage(claim);
				legacy
					.prepare(`INSERT INTO beliefs (claim, claim_normalized, certainty, evidence, source,
     category, created_at, verified_at, provenance, embedding, embedding_norm, embedding_dim,
     embedding_version) VALUES (?, ?, 0.9, 1, 'explicit', 'fact', 1, 1, 'legacy-src', ?, ?, ?, ?)`)
					.run(
						claim,
						prepared.claimNormalized,
						prepared.embedding,
						prepared.embeddingNorm,
						prepared.embeddingDim,
						prepared.embeddingVersion,
					);
			}
			legacy.close();
			const db = await openCodexDb(path);
			try {
				const before = Number(db.prepare('SELECT total_changes() AS n').get()?.n);
				db.prepare('UPDATE beliefs SET provenance = ? WHERE id = 1').run('metadata-src');
				// Only the outer update and provenance-history update should write; FTS must stay untouched.
				assert.equal(Number(db.prepare('SELECT total_changes() AS n').get()?.n) - before, 2);

				for (const id of [1, 2, 3]) {
					let current = id;
					for (const word of ['replacement', 'final']) {
						const claim = `${word} number ${id}`;
						const result = correctBelief(db, current, { claim, provenance }, { now: 20 });
						assert.equal(result.claim, claim);
						assert.ok(result.provenanceSources?.includes('legacy-src'));
						current = result.id;
					}
				}
				// A direct claim update must remove the old indexed terms exactly once, even with provenance.
				db.prepare('UPDATE beliefs SET claim = ?, provenance = ? WHERE id = 1').run(
					'reindexed alpha',
					'another-src',
				);
				assert.equal(
					db
						.prepare("SELECT count(*) AS n FROM beliefs_fts WHERE beliefs_fts MATCH 'legacy alpha'")
						.get()?.n,
					0,
				);
				assert.equal(
					db
						.prepare("SELECT count(*) AS n FROM beliefs_fts WHERE beliefs_fts MATCH 'reindexed'")
						.get()?.n,
					1,
				);
				assert.equal(
					db.prepare("SELECT count(*) AS n FROM beliefs_fts WHERE beliefs_fts MATCH 'final'").get()
						?.n,
					3,
				);
				assert.equal(db.prepare('PRAGMA integrity_check').get()?.integrity_check, 'ok');
				db.exec("INSERT INTO beliefs_fts(beliefs_fts, rank) VALUES ('integrity-check', 1)");
				// Simulate a database already opened by 0.6.1, with its broad trigger and a stale index.
				db.exec(`DROP TRIGGER beliefs_au;
     CREATE TRIGGER beliefs_au AFTER UPDATE ON beliefs BEGIN
      INSERT INTO beliefs_fts(beliefs_fts, rowid, claim) VALUES ('delete', old.id, old.claim);
      INSERT INTO beliefs_fts(rowid, claim) VALUES (new.id, new.claim);
     END;
     INSERT INTO beliefs_fts(beliefs_fts, rowid, claim) VALUES ('delete', 1, 'reindexed alpha');`);
				initCodexTables(db);
				initCodexTables(db);
				const repairedBefore = Number(db.prepare('SELECT total_changes() AS n').get()?.n);
				db.prepare('UPDATE beliefs SET provenance = ? WHERE id = 1').run('repaired-src');
				assert.equal(
					Number(db.prepare('SELECT total_changes() AS n').get()?.n) - repairedBefore,
					2,
				);
				assert.equal(
					db
						.prepare("SELECT count(*) AS n FROM beliefs_fts WHERE beliefs_fts MATCH 'reindexed'")
						.get()?.n,
					1,
				);
				assert.equal(db.prepare('PRAGMA integrity_check').get()?.integrity_check, 'ok');
				db.exec("INSERT INTO beliefs_fts(beliefs_fts, rank) VALUES ('integrity-check', 1)");
			} finally {
				db.close();
			}
		} finally {
			rmSync(directory, { recursive: true, force: true });
		}
	});
}
