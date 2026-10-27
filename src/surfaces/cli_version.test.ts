import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cliVersion } from './cli_version.ts';

test('human version identifies binary, npm and library execution', () => {
	assert.equal(
		cliVersion('1.2.3', { sea: () => true, platform: 'linux', arch: 'x64', npm: true }),
		'ghostpaw-codex 1.2.3 (binary, linux-x64)',
	);
	assert.equal(
		cliVersion('1.2.3', { sea: () => true, platform: 'win32', arch: 'x64' }),
		'ghostpaw-codex 1.2.3 (binary, windows-x64)',
	);
	assert.equal(cliVersion('1.2.3', { sea: () => false, npm: true }), 'ghostpaw-codex 1.2.3 (npm)');
	assert.equal(
		cliVersion('1.2.3', { sea: () => false, npm: false }),
		'ghostpaw-codex 1.2.3 (library)',
	);
	assert.equal(
		cliVersion('1.2.3', {
			sea: () => {
				throw new Error('unavailable');
			},
			npm: false,
		}),
		'ghostpaw-codex 1.2.3 (library)',
	);
});
