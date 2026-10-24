import { chmodSync } from 'node:fs';
import { defineConfig } from 'tsup';

export default defineConfig([
	{
		entry: ['src/index.ts', 'src/mcp.ts'],
		format: ['esm', 'cjs'],
		dts: true,
		clean: true,
		target: 'node24',
		splitting: false,
		sourcemap: false,
		treeshake: true,
		external: ['node:sqlite'],
		removeNodeProtocol: false,
	},
	{
		entry: ['src/cli.ts'],
		format: ['esm'],
		dts: false,
		target: 'node24',
		splitting: false,
		sourcemap: false,
		treeshake: true,
		external: ['node:sqlite'],
		removeNodeProtocol: false,
		banner: { js: '#!/usr/bin/env node' },
		onSuccess: async () => {
			chmodSync('dist/cli.js', 0o755);
		},
	},
]);
