import type { CodexDb } from '../database.ts';

/** Carry all references forward without dropping the successor's own references. */
export function inheritProvenance(db: CodexDb, target: number, predecessors: number[]): void {
	const sources: string[] = [];
	for (const id of [target, ...predecessors]) {
		const row = db
			.prepare('SELECT provenance_sources FROM beliefs WHERE id = ?')
			.get<{ provenance_sources: string }>(id);
		for (const source of JSON.parse(row?.provenance_sources ?? '[]') as string[]) {
			if (!sources.includes(source)) sources.push(source);
		}
	}
	db.prepare('UPDATE beliefs SET provenance_sources = ? WHERE id = ?').run(
		JSON.stringify(sources),
		target,
	);
}
