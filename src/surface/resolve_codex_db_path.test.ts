import assert from 'node:assert/strict';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { resolveCodexDbPath } from './resolve_codex_db_path.ts';

test('database path precedence is flag, environment, home default', () => {
	assert.equal(
		resolveCodexDbPath({ flag: ':memory:', env: { GHOSTPAW_CODEX_DB: 'env' } }),
		':memory:',
	);
	assert.equal(resolveCodexDbPath({ env: { GHOSTPAW_CODEX_DB: 'env' } }), 'env');
	assert.equal(resolveCodexDbPath({ env: {} }), join(homedir(), '.ghostpaw', 'codex.db'));
});
