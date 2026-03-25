import { ok, strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';
import { remember } from '../beliefs/remember.ts';
import { createInitializedCodexDb } from '../lib/test-db.ts';
import { searchCodexTool, searchCodexToolHandler } from './search_codex_tool.ts';

describe('searchCodexTool', () => {
	it('has correct name and metadata', () => {
		strictEqual(searchCodexTool.name, 'search_codex');
		strictEqual(searchCodexTool.readOnly, true);
		strictEqual(searchCodexTool.sideEffects, 'none');
		strictEqual(searchCodexTool.inputSchema.type, 'object');
		strictEqual(typeof searchCodexTool.whenToUse, 'string');
		strictEqual(typeof searchCodexTool.whenNotToUse, 'string');
	});
});

describe('searchCodexToolHandler', () => {
	it('returns ranked results for a query', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'GraphQL API', source: 'explicit', category: 'fact' }, { now: 1 });
		const result = searchCodexToolHandler(db, { query: 'GraphQL', minScore: 0 });
		strictEqual(result.ok, true);
		if (result.ok) {
			strictEqual(result.data.results.length >= 1, true);
			strictEqual(result.entities.length >= 1, true);
			ok(result.next && result.next.length > 0);
		}
	});

	it('returns empty_result warning for no matches', async () => {
		const db = await createInitializedCodexDb();
		const result = searchCodexToolHandler(db, { query: 'nonexistent', minScore: 0 });
		strictEqual(result.ok, true);
		if (result.ok) {
			ok(result.warnings?.some((w) => w.code === 'empty_result'));
		}
	});

	it('suggests review_codex when no results found', async () => {
		const db = await createInitializedCodexDb();
		const result = searchCodexToolHandler(db, { query: 'nothing here', minScore: 0 });
		strictEqual(result.ok, true);
		if (result.ok) {
			ok(result.next?.some((n) => n.kind === 'review_view'));
		}
	});

	it('returns inspect hints for top results', async () => {
		const db = await createInitializedCodexDb();
		remember(
			db,
			{ claim: 'TypeScript types rock', source: 'explicit', category: 'fact' },
			{ now: 1 },
		);
		const result = searchCodexToolHandler(db, { query: 'TypeScript', minScore: 0 });
		strictEqual(result.ok, true);
		if (result.ok && result.data.results.length > 0) {
			ok(result.next?.some((n) => n.kind === 'inspect_item'));
		}
	});

	it('returns empty for empty query via recall short-circuit', async () => {
		const db = await createInitializedCodexDb();
		remember(db, { claim: 'Exists', source: 'explicit', category: 'fact' }, { now: 1 });
		const result = searchCodexToolHandler(db, { query: '', minScore: 0 });
		strictEqual(result.ok, true);
		if (result.ok) strictEqual(result.data.results.length, 0);
	});
});
