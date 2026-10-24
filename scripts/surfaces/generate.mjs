import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderManifests } from '../../src/surfaces/manifests.ts';
import { renderSkillMarkdown } from '../../src/surfaces/skill_markdown.ts';
import { config } from './config.mjs';

const manifests = renderManifests(config.manifest);
const files = new Map([
	[`skills/${config.slug}/SKILL.md`, renderSkillMarkdown(config.skill)],
	...config.workflows.map((skill) => [
		`skills/${config.slug}/references/${skill.name}.md`,
		skill.content,
	]),
	...Object.entries({
		'plugin.json': manifests.plugin,
		'mcp.json': manifests.mcp,
		'.claude-plugin/plugin.json': manifests.claudePlugin,
		'.claude-plugin/marketplace.json': manifests.claudeMarketplace,
		'server.json': manifests.server,
	}).map(([path, data]) => [path, `${JSON.stringify(data, null, 2)}\n`]),
]);
for (const [path, content] of files) {
	const absolute = fileURLToPath(new URL(`../../${path}`, import.meta.url));
	if (process.argv.includes('--check')) {
		let actual;
		try {
			actual = readFileSync(absolute, 'utf8');
		} catch {
			/* Missing files are drift. */
		}
		if (actual !== content) {
			console.error(`Drift: ${path}`);
			process.exitCode = 1;
		}
	} else {
		mkdirSync(dirname(absolute), { recursive: true });
		writeFileSync(absolute, content);
	}
}
