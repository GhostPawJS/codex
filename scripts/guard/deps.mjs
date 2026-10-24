import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
for (const field of [
	'dependencies',
	'optionalDependencies',
	'peerDependencies',
	'bundleDependencies',
	'bundledDependencies',
]) {
	const value = pkg[field];
	assert.ok(
		value === undefined ||
			(value !== null && typeof value === 'object' && Object.keys(value).length === 0),
		`${field} must be empty: zero runtime dependencies`,
	);
}
console.log('Dependencies: zero runtime dependencies.');
