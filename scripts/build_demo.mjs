#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import * as esbuild from 'esbuild';

const OUT_DIR = 'demo';
const ENTRY = 'src/demo/main.tsx';
const WATCH = process.argv.includes('--watch');
const EMPTY_MODULE = resolve('src/demo/empty_module.ts');

/** @type {import("esbuild").BuildOptions} */
const buildOptions = {
	entryPoints: [ENTRY],
	outdir: OUT_DIR,
	bundle: true,
	format: 'esm',
	platform: 'browser',
	target: ['es2022'],
	sourcemap: true,
	jsx: 'automatic',
	jsxImportSource: 'preact',
	loader: { '.wasm': 'file' },
	entryNames: 'app',
	assetNames: 'assets/[name]-[hash]',
	alias: {
		fs: EMPTY_MODULE,
		path: EMPTY_MODULE,
	},
};

const CSS = /* css */ `
@import url("https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700&family=Manrope:wght@400;500;700&display=swap");

:root {
	color-scheme: dark;
	--bg: #0a0d12;
	--panel: rgba(16, 22, 32, 0.88);
	--panel-strong: rgba(20, 28, 41, 0.96);
	--border: rgba(125, 173, 255, 0.18);
	--border-strong: rgba(125, 173, 255, 0.34);
	--text: #edf3ff;
	--muted: #93a4bf;
	--accent: #61dafb;
	--accent-soft: rgba(97, 218, 251, 0.14);
	--success: #72f1b8;
	--warn: #ffc857;
	--danger: #ff7a90;
	--font-display: "Orbitron", sans-serif;
	--font-body: "Manrope", sans-serif;
}

* { box-sizing: border-box; }
html, body { min-height: 100%; }
body {
	margin: 0;
	font-family: var(--font-body);
	background:
		radial-gradient(circle at top left, rgba(97, 218, 251, 0.1), transparent 34%),
		radial-gradient(circle at bottom right, rgba(255, 200, 87, 0.08), transparent 28%),
		var(--bg);
	color: var(--text);
}

a { color: var(--accent); }

#app {
	max-width: 1160px;
	margin: 0 auto;
	padding: 32px 20px 80px;
}

.shell {
	display: grid;
	gap: 20px;
}

.hero {
	padding: 24px;
	border: 1px solid var(--border);
	border-radius: 18px;
	background: var(--panel);
	backdrop-filter: blur(16px);
}

.hero h1, .card h2, .card h3 {
	margin: 0;
	font-family: var(--font-display);
	letter-spacing: 0.04em;
}

.hero p, .muted {
	color: var(--muted);
}

.grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
	gap: 20px;
}

.card {
	padding: 20px;
	border: 1px solid var(--border);
	border-radius: 16px;
	background: var(--panel-strong);
	box-shadow: 0 10px 30px rgba(0, 0, 0, 0.24);
}

.stat {
	display: block;
	font-size: 2rem;
	font-weight: 700;
	margin-top: 8px;
}

.pill {
	display: inline-flex;
	align-items: center;
	gap: 8px;
	padding: 4px 10px;
	border: 1px solid var(--border-strong);
	border-radius: 999px;
	background: var(--accent-soft);
	font-size: 0.78rem;
}

.list {
	display: grid;
	gap: 10px;
	margin-top: 14px;
}

.item {
	padding: 12px 14px;
	border: 1px solid var(--border);
	border-radius: 12px;
	background: rgba(255, 255, 255, 0.02);
}

.item strong {
	display: block;
	margin-bottom: 4px;
}

.row {
	display: flex;
	flex-wrap: wrap;
	gap: 12px;
	align-items: center;
}

.row .success { color: var(--success); }
.row .warn { color: var(--warn); }
.row .danger { color: var(--danger); }
`;

const FAVICON = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect x='3' y='3' width='58' height='58' rx='10' fill='%230a0d12' stroke='%2361dafb' stroke-width='3'/><path d='M20 18h16c7.18 0 12 4.64 12 11.19 0 4.65-2.49 8.22-6.88 10.06L47 46H36.34l-4.8-5.3H29V46H20V18zm9 7v9h6.25c2.41 0 3.9-1.72 3.9-4.48 0-2.92-1.54-4.52-4.34-4.52H29z' fill='%2361dafb'/></svg>`;

function writeHtmlShell() {
	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Codex Demo</title>
<link rel="icon" href="${FAVICON}" />
<style>${CSS}</style>
</head>
<body>
<div id="app"></div>
<script type="module" src="./app.js"></script>
</body>
</html>`;
}

async function main() {
	await mkdir(OUT_DIR, { recursive: true });

	if (WATCH) {
		const ctx = await esbuild.context(buildOptions);
		await ctx.watch();
		console.log('[demo] watching for changes ...');
	} else {
		await esbuild.build(buildOptions);
		console.log('[demo] build complete');
	}

	await writeFile(join(OUT_DIR, 'index.html'), writeHtmlShell());
	console.log('[demo] wrote index.html');
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
