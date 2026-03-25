export interface CodexRunResult {
	lastInsertRowid: number | bigint;
	changes?: number | bigint | undefined;
}

export interface CodexStatement {
	run(...params: unknown[]): CodexRunResult;
	get<TRecord = Record<string, unknown>>(...params: unknown[]): TRecord | undefined;
	all<TRecord = Record<string, unknown>>(...params: unknown[]): TRecord[];
}

/**
 * SQLite dependency injected into every codex operation.
 * Node.js `DatabaseSync` satisfies this interface directly.
 */
export type CodexDb = {
	exec(sql: string): void;
	prepare(sql: string): CodexStatement;
	close(): void;
};
