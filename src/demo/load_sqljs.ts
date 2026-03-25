import initSqlJs from 'sql.js-fts5';
import sqlWasmUrl from 'sql.js-fts5/dist/sql-wasm.wasm';

export interface SqlJsStatement {
	bind(values: readonly unknown[]): boolean;
	free(): void;
	getAsObject(): Record<string, unknown>;
	step(): boolean;
}

export interface SqlJsExecResult {
	columns: string[];
	values: unknown[][];
}

export interface SqlJsDatabase {
	close(): void;
	exec(sql: string, params?: readonly unknown[]): SqlJsExecResult[];
	prepare(sql: string): SqlJsStatement;
	run(sql: string, params?: readonly unknown[]): void;
}

interface SqlJsModule {
	Database: new () => SqlJsDatabase;
}

let sqlJsPromise: Promise<SqlJsModule> | null = null;

export function loadSqlJs(): Promise<SqlJsModule> {
	if (sqlJsPromise === null) {
		sqlJsPromise = initSqlJs({
			locateFile(fileName: string) {
				if (fileName.endsWith('.wasm')) {
					return sqlWasmUrl;
				}
				return fileName;
			},
		}) as Promise<SqlJsModule>;
	}

	return sqlJsPromise;
}
