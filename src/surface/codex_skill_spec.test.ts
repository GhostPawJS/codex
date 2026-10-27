import assert from 'node:assert/strict';
import { test } from 'node:test';
import { renderSkillMarkdown } from '../surfaces/skill_markdown.ts';
import { codexSkillSpec } from './codex_skill_spec.ts';

test('skill opens with binary installation and ends with npm and library alternatives', () => {
	const result = renderSkillMarkdown(codexSkillSpec);
	assert.ok(result.includes('# codex\n\n## Install\n'));
	assert.ok(result.includes('install.sh | sh'));
	assert.ok(result.includes('install.ps1 | iex'));
	assert.ok(result.includes('after checking SHA256SUMS'));
	assert.ok(result.includes('`~/.local/bin/ghostpaw-codex` if it is not on PATH'));
	const [body, fallback] = result.slice(result.indexOf('# codex')).split('## Without the binary');
	assert.ok(!body?.includes('npx'));
	assert.ok(fallback?.includes('Node 24+'));
	assert.ok(fallback?.includes('npx -y @ghostpaw/codex ...'));
	assert.ok(fallback?.includes('import `@ghostpaw/codex` as a library'));
});
