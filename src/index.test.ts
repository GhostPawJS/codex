import { strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import { initCodexTables, read, skills, soul, tools, write } from './index.ts';

describe('package root exports', () => {
	it('exposes the main codex namespaces', () => {
		strictEqual(typeof initCodexTables, 'function');
		strictEqual(typeof read.recall, 'function');
		strictEqual(typeof write.remember, 'function');
		strictEqual(Array.isArray(tools.codexTools), true);
		strictEqual(typeof skills, 'object');
		strictEqual(typeof skills.listCodexSkills, 'function');
		strictEqual(typeof skills.getCodexSkillByName, 'function');
		strictEqual(typeof soul, 'object');
		strictEqual(typeof soul.codexSoul, 'object');
		strictEqual(typeof soul.renderCodexSoulPromptFoundation, 'function');
	});

	it('does not leak namespaced members to the top level', () => {
		const pkg = { initCodexTables, read, skills, soul, tools, write } as Record<string, unknown>;
		strictEqual('codexSoul' in pkg, false);
		strictEqual('renderCodexSoulPromptFoundation' in pkg, false);
		strictEqual('recall' in pkg, false);
		strictEqual('remember' in pkg, false);
	});
});
