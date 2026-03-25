import { strictEqual, throws } from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { describe, it } from 'node:test';

import { withTransaction } from './with_transaction.ts';

describe('withTransaction', () => {
	it('commits outer work and rolls back fully on failure', () => {
		const db = new DatabaseSync(':memory:');
		db.exec('CREATE TABLE t (id INTEGER PRIMARY KEY, v INTEGER NOT NULL)');

		withTransaction(db, () => {
			db.prepare('INSERT INTO t (v) VALUES (1)').run();
		});

		strictEqual(Number(db.prepare('SELECT COUNT(*) AS c FROM t').get()?.c ?? 0), 1);

		throws(
			() =>
				withTransaction(db, () => {
					db.prepare('INSERT INTO t (v) VALUES (2)').run();
					throw new Error('boom');
				}),
			/boom/,
		);

		strictEqual(Number(db.prepare('SELECT COUNT(*) AS c FROM t').get()?.c ?? 0), 1);
	});

	it('nested savepoints roll back inner work only when the inner error is handled', () => {
		const db = new DatabaseSync(':memory:');
		db.exec('CREATE TABLE t (id INTEGER PRIMARY KEY, v INTEGER NOT NULL)');

		withTransaction(db, () => {
			db.prepare('INSERT INTO t (v) VALUES (1)').run();
			throws(
				() =>
					withTransaction(db, () => {
						db.prepare('INSERT INTO t (v) VALUES (2)').run();
						throw new Error('inner');
					}),
				/inner/,
			);
			db.prepare('INSERT INTO t (v) VALUES (3)').run();
		});

		const rows = db.prepare('SELECT v FROM t ORDER BY v').all() as Array<{ v: number }>;
		strictEqual(rows.map((row) => row.v).join(','), '1,3');
	});

	it('nested savepoints still roll back everything when the outer transaction fails', () => {
		const db = new DatabaseSync(':memory:');
		db.exec('CREATE TABLE t (id INTEGER PRIMARY KEY, v INTEGER NOT NULL)');

		throws(
			() =>
				withTransaction(db, () => {
					db.prepare('INSERT INTO t (v) VALUES (1)').run();
					withTransaction(db, () => {
						db.prepare('INSERT INTO t (v) VALUES (2)').run();
					});
					throw new Error('outer');
				}),
			/outer/,
		);

		strictEqual(Number(db.prepare('SELECT COUNT(*) AS c FROM t').get()?.c ?? 0), 0);
	});
});
