import { defineConfig } from 'tsup';

export default defineConfig({
	entry: ['src/index.ts'],
	format: ['esm', 'cjs'],
	dts: true,
	clean: true,
	target: 'node24',
	splitting: false,
	sourcemap: false,
	treeshake: true,
});
