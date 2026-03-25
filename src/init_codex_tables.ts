import { initBeliefSearch } from './beliefs/init_belief_search.ts';
import { initBeliefTables } from './beliefs/init_belief_tables.ts';
import type { CodexDb } from './database.ts';
import { initDismissalTables } from './dismissals/init_dismissal_tables.ts';

/** Creates the full standalone codex schema, including FTS and support tables. */
export function initCodexTables(db: CodexDb): void {
	initBeliefTables(db);
	initDismissalTables(db);
	initBeliefSearch(db);
}
