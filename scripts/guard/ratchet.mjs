import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { run as runCommand } from './process.mjs';

export function compareBudgets(before, after, path = '') {
	const changes = [];
	for (const [key, value] of Object.entries(before)) {
		const name = path ? `${path}.${key}` : key;
		if (!(key in after)) changes.push(`${name}: removed`);
		else if (value && typeof value === 'object') {
			if (!after[key] || typeof after[key] !== 'object')
				changes.push(`${name}: invalid replacement`);
			else changes.push(...compareBudgets(value, after[key], name));
		} else {
			if (typeof after[key] !== 'number' || !Number.isFinite(after[key]) || after[key] > value)
				changes.push(`${name}: ${value} → ${after[key]}`);
		}
	}
	return changes;
}
export function compareApi(before, after) {
	return [...new Set([...Object.keys(before), ...Object.keys(after)])]
		.filter((key) => JSON.stringify(before[key]) !== JSON.stringify(after[key]))
		.map((key) => `${key}: ${key in after ? (key in before ? 'changed' : 'added') : 'removed'}`);
}
export const GUARDED_PATHS = [
	'scripts/guard/',
	'.github/workflows/',
	'biome.json',
	'tsconfig.json',
];
/** Changed gate files, deleted/renamed test files, and changed check/test scripts. */
export function guardrailChanges(nameStatus, oldScripts, newScripts) {
	const changes = nameStatus
		.split('\n')
		.filter(Boolean)
		.filter((line) => {
			const [status, file] = line.split('\t');
			if (file.startsWith('src/')) return /\.test\.ts$/.test(file) && /^[DR]/.test(status);
			return GUARDED_PATHS.some((path) => file === path || file.startsWith(path));
		});
	for (const key of new Set([...Object.keys(oldScripts), ...Object.keys(newScripts)]))
		if (
			/^(check|test|prepublishOnly|budgets|surfaces)/.test(key) &&
			oldScripts[key] !== newScripts[key]
		)
			changes.push(`package.json scripts.${key}: ${oldScripts[key]} → ${newScripts[key]}`);
	return changes;
}
function git(...args) {
	return runCommand('git', args).trim();
}
export function selectBase(explicit) {
	if (explicit) return git('rev-parse', '--verify', `${explicit}^{commit}`);
	for (const ref of ['origin/main']) {
		try {
			return git('merge-base', 'HEAD', ref);
		} catch {
			/* Try the next documented fallback. */
		}
	}
	return git('rev-parse', 'HEAD~1');
}
function run() {
	const index = process.argv.indexOf('--base');
	if (index >= 0 && !process.argv[index + 1]) throw new Error('--base needs a ref');
	const base = selectBase(index >= 0 ? process.argv[index + 1] : process.env.RATCHET_BASE);
	// PR workflows check out a synthetic merge; use only actual PR head commit messages.
	const event =
		process.env.GITHUB_EVENT_PATH && existsSync(process.env.GITHUB_EVENT_PATH)
			? JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'))
			: null;
	const head = event?.pull_request?.head?.sha ?? 'HEAD';
	const messages = git('log', '--format=%B', `${base}..${head}`);
	const failures = [];
	for (const [file, tag, compare] of [
		['budgets.json', '[budget-increase-approved]', compareBudgets],
		['api-surface.json', '[api-change-approved]', compareApi],
	]) {
		// Only a genuinely absent file is bootstrapping; other git errors must fail.
		const files = git('ls-tree', '--name-only', base, '--', file);
		if (!files) {
			console.log(`Ratchet: initializing ${file} (absent at base).`);
			continue;
		}
		const oldText = runCommand('git', ['show', `${base}:${file}`]);
		const currentText = readFileSync(file, 'utf8');
		const changes = compare(JSON.parse(oldText), JSON.parse(currentText));
		if (file === 'api-surface.json' && oldText !== currentText && !changes.length)
			changes.push('Snapshot formatting or key order changed');
		if (changes.length) {
			console.log(`${file}:\n${changes.join('\n')}`);
			if (!messages.includes(tag)) failures.push(`Requires ${tag}`);
		}
	}
	// The gates themselves: weakening them must be as visible as loosening a budget.
	const oldPkg = JSON.parse(git('show', `${base}:package.json`));
	const currentPkg = JSON.parse(readFileSync('package.json', 'utf8'));
	const diff = git('diff', '--name-status', '--find-renames', base, '--', ...GUARDED_PATHS, 'src');
	const trackedDiff = diff
		.split('\n')
		.filter((line) => {
			const file = line.split('\t')[1];
			if (!file) return false;
			if (!git('ls-tree', '--name-only', base, '--', file)) {
				console.log(`Ratchet: initializing ${file} (absent at base).`);
				return false;
			}
			return true;
		})
		.join('\n');
	const guardChanges = guardrailChanges(
		trackedDiff,
		oldPkg.scripts ?? {},
		currentPkg.scripts ?? {},
	);
	if (guardChanges.length) {
		console.log(`Guardrail changes:\n${guardChanges.join('\n')}`);
		if (!messages.includes('[guardrails-change-approved]'))
			failures.push('Requires [guardrails-change-approved]');
	}
	if (failures.length) throw new Error(failures.join('\n'));
	console.log(`Ratchet passed against ${base}.`);
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) run();
