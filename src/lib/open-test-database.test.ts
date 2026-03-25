import { strictEqual, throws } from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { describe, it } from 'node:test';

import { openTestDatabase } from './open-test-database.ts';

describe('openTestDatabase', () => {
	it('returns an isolated in-memory DatabaseSync instance', async () => {
		const a = await openTestDatabase();
		const b = await openTestDatabase();

		strictEqual(a instanceof DatabaseSync, true);
		a.exec('CREATE TABLE x (v INTEGER)');

		throws(() => {
			b.prepare('SELECT * FROM x').get();
		}, /no such table/i);
	});

	it('enables foreign key enforcement for tests', async () => {
		const db = await openTestDatabase();
		db.exec('CREATE TABLE parents (id INTEGER PRIMARY KEY)');
		db.exec(
			'CREATE TABLE children (id INTEGER PRIMARY KEY, parent_id INTEGER REFERENCES parents(id))',
		);

		throws(() => {
			db.prepare('INSERT INTO children (parent_id) VALUES (?)').run(999);
		}, /foreign key/i);
	});
});
