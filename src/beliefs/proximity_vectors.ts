import type { CodexDb } from '../database.ts';
import { deserializeVectorBlob } from '../lib/deserialize_vector_blob.ts';

type Vector = { id: number; vector: Float32Array | null };
type Revision = { n: number; v: number };
type Snapshot = Revision & { rows: Vector[] };
const snapshots = new WeakMap<CodexDb, Snapshot>();
function revision(db: CodexDb): Revision {
	return db
		.prepare('SELECT total_changes() AS n, data_version AS v FROM pragma_data_version')
		.get() as Revision;
}
function cacheable(db: CodexDb): boolean {
	return (db as CodexDb & { isTransaction?: boolean }).isTransaction === false;
}
export function currentProximitySnapshot(db: CodexDb): Snapshot | undefined {
	const cached = snapshots.get(db);
	if (!cached || !cacheable(db)) return;
	const { n, v } = revision(db);
	if (cached.n === n && cached.v === v) return cached;
}
export function appendProximityVector(
	db: CodexDb,
	before: Snapshot | undefined,
	id: number,
	blob: unknown,
): void {
	if (!before) return;
	const { n, v } = revision(db);
	if (before.v !== v) return;
	before.rows.push({ id, vector: deserializeVectorBlob(blob) });
	before.n = n;
}
export function loadProximityVectors(db: CodexDb): Vector[] {
	const cached = currentProximitySnapshot(db);
	if (cached) return cached.rows;
	const initial = cacheable(db) ? revision(db) : undefined;
	const rows = db
		.prepare('SELECT id, embedding FROM beliefs WHERE superseded_by IS NULL')
		.all<{ id: number; embedding: unknown }>()
		.map(({ id, embedding }) => ({ id, vector: deserializeVectorBlob(embedding) }));
	// Caller transactions may roll back without changing data_version.
	if (initial) snapshots.set(db, { ...initial, rows });
	return rows;
}
