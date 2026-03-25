import type { CodexDb } from './database.ts';

const transactionDepth = new WeakMap<CodexDb, number>();

/**
 * Runs a synchronous transaction with nested-savepoint support.
 */
export function withTransaction<T>(db: CodexDb, fn: () => T): T {
	const depth = transactionDepth.get(db) ?? 0;
	const savepoint = `codex_${depth}`;

	if (depth === 0) {
		db.exec('BEGIN IMMEDIATE');
	} else {
		db.exec(`SAVEPOINT ${savepoint}`);
	}

	transactionDepth.set(db, depth + 1);

	try {
		const result = fn();
		if (depth === 0) {
			db.exec('COMMIT');
		} else {
			db.exec(`RELEASE SAVEPOINT ${savepoint}`);
		}
		transactionDepth.set(db, depth);
		return result;
	} catch (error) {
		try {
			if (depth === 0) {
				db.exec('ROLLBACK');
			} else {
				db.exec(`ROLLBACK TO SAVEPOINT ${savepoint}`);
				db.exec(`RELEASE SAVEPOINT ${savepoint}`);
			}
		} catch {
			// Best-effort rollback.
		}
		transactionDepth.set(db, depth);
		throw error;
	}
}
