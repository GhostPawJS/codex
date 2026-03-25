declare module 'sql.js-fts5/dist/sql-wasm.wasm' {
	const url: string;
	export default url;
}

declare module 'sql.js-fts5' {
	function initSqlJs(config?: Record<string, unknown>): Promise<unknown>;
	export default initSqlJs;
}
