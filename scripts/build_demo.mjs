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
/* ── Fonts ─────────────────────────────────────────────────────── */
@import url("https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700&family=Manrope:wght@400;500;600;700&family=JetBrains+Mono:wght@400&display=swap");

/* ── Design tokens ─────────────────────────────────────────────── */
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
	--font-mono: "JetBrains Mono", "Fira Code", monospace;
	--sidebar-w: 240px;
}

/* ── Reset ─────────────────────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body { min-height: 100vh; }
body {
	font-family: var(--font-body);
	font-size: 0.92rem;
	font-weight: 400;
	line-height: 1.6;
	background:
		radial-gradient(circle at top left, rgba(97, 218, 251, 0.08), transparent 34%),
		radial-gradient(circle at bottom right, rgba(255, 200, 87, 0.06), transparent 28%),
		var(--bg);
	color: var(--text);
	-webkit-font-smoothing: antialiased;
}
a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; }
button { font-family: inherit; cursor: pointer; border: none; background: none; color: inherit; }
input, textarea, select { font-family: inherit; color: inherit; }

/* ── Focus rings ───────────────────────────────────────────────── */
:focus-visible {
	outline: 2px solid var(--accent);
	outline-offset: 2px;
}

/* ── Typography ────────────────────────────────────────────────── */
.page-title {
	font-family: var(--font-display);
	font-weight: 700;
	font-size: clamp(1.25rem, 4vw, 1.8rem);
	letter-spacing: 0.04em;
	line-height: 1.3;
	margin-bottom: 20px;
}
.title-badge {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 28px;
	height: 28px;
	padding: 0 8px;
	border-radius: 999px;
	background: var(--warn);
	color: var(--bg);
	font-size: 0.82rem;
	font-weight: 700;
	vertical-align: middle;
	margin-left: 8px;
}
h2, .panel-title {
	font-family: var(--font-display);
	font-weight: 500;
	font-size: clamp(0.95rem, 3vw, 1.15rem);
	letter-spacing: 0.03em;
	line-height: 1.35;
}
h3 { font-family: var(--font-body); font-weight: 600; font-size: 0.9rem; line-height: 1.4; }
.muted { color: var(--muted); }

/* ── Layout ────────────────────────────────────────────────────── */
#app { min-height: 100vh; }

.boot-screen {
	display: flex; align-items: center; justify-content: center;
	min-height: 100vh; padding: 20px; text-align: center;
}
.boot-error { color: var(--danger); }

.main-content {
	margin-left: var(--sidebar-w);
	min-height: 100vh;
	padding: 32px 28px 80px;
}
.main-content > .page {
	max-width: 860px;
	margin: 0 auto;
	display: grid;
	gap: 20px;
}

/* ── Sidebar ───────────────────────────────────────────────────── */
.sidebar {
	position: fixed;
	top: 0; left: 0;
	width: var(--sidebar-w);
	height: 100vh;
	overflow-y: auto;
	background: var(--panel-strong);
	backdrop-filter: blur(20px);
	border-right: 1px solid var(--border);
	display: flex;
	flex-direction: column;
	z-index: 100;
	padding: 24px 0;
}
.sidebar-backdrop { display: none; }
.hamburger { display: none; }

.sidebar-brand {
	display: flex; align-items: center; gap: 12px;
	padding: 0 20px 24px;
	border-bottom: 1px solid var(--border);
	margin-bottom: 16px;
}
.sidebar-logo {
	display: flex; align-items: center; justify-content: center;
	width: 36px; height: 36px;
	border-radius: 10px;
	background: var(--accent-soft);
	border: 1px solid var(--accent);
	font-family: var(--font-display);
	font-size: 1.1rem;
	font-weight: 700;
	color: var(--accent);
}
.sidebar-title {
	font-family: var(--font-display);
	font-weight: 700;
	font-size: 1.1rem;
	letter-spacing: 0.06em;
}

.sidebar-nav {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 2px;
	padding: 0 10px;
}
.nav-item {
	display: flex; align-items: center; gap: 12px;
	padding: 10px 14px;
	border-radius: 10px;
	font-size: 0.92rem;
	font-weight: 500;
	transition: background 0.15s ease;
	min-height: 42px;
	text-align: left;
	width: 100%;
}
.nav-item:hover { background: var(--accent-soft); }
.nav-active { background: var(--accent-soft); color: var(--accent); }
.nav-icon { font-size: 1.1rem; width: 24px; text-align: center; flex-shrink: 0; }
.nav-label { flex: 1; }
.nav-badge {
	display: inline-flex; align-items: center; justify-content: center;
	min-width: 22px; height: 22px;
	padding: 0 6px;
	border-radius: 999px;
	background: var(--warn);
	color: var(--bg);
	font-size: 0.72rem;
	font-weight: 700;
}

.sidebar-footer {
	padding: 16px 20px 0;
	border-top: 1px solid var(--border);
	margin-top: 12px;
}
.sidebar-integrity {
	display: flex; justify-content: space-between; align-items: center;
	margin-bottom: 12px;
}
.sidebar-integrity-label { font-size: 0.78rem; font-weight: 600; letter-spacing: 0.03em; text-transform: uppercase; color: var(--muted); }
.sidebar-integrity-value { font-family: var(--font-display); font-weight: 700; font-size: 0.95rem; }
.sidebar-reset-row { display: flex; gap: 8px; flex-wrap: wrap; }

/* ── Panel (glassmorphic container) ────────────────────────────── */
.panel {
	padding: 24px;
	border: 1px solid var(--border);
	border-radius: 16px;
	background: var(--panel);
	backdrop-filter: blur(16px);
	min-width: 0;
}
.panel-header {
	display: flex; justify-content: space-between; align-items: flex-start;
	gap: 12px;
	margin-bottom: 16px;
}
.panel-subtitle { color: var(--muted); font-size: 0.82rem; margin-top: 4px; }
.panel-body { display: grid; gap: 14px; }

/* ── Badges ────────────────────────────────────────────────────── */
.badge {
	display: inline-flex; align-items: center;
	padding: 3px 10px;
	border-radius: 999px;
	font-size: 0.75rem;
	font-weight: 600;
	letter-spacing: 0.02em;
	white-space: nowrap;
	line-height: 1.4;
}
.badge-evidence {
	background: var(--accent-soft);
	color: var(--accent);
	border: 1px solid rgba(97, 218, 251, 0.25);
}

/* ── Bars ──────────────────────────────────────────────────────── */
.bar-wrap {
	display: flex; align-items: center; gap: 10px;
	min-width: 0;
}
.bar-track {
	flex: 1;
	height: 8px;
	border-radius: 4px;
	background: rgba(255, 255, 255, 0.06);
	overflow: hidden;
	min-width: 40px;
}
.bar-fill {
	height: 100%;
	border-radius: 4px;
	transition: width 0.3s ease;
}
.bar-label {
	font-size: 0.78rem;
	font-weight: 600;
	color: var(--muted);
	flex-shrink: 0;
	min-width: 36px;
	text-align: right;
}
.bar-inline-label {
	font-size: 0.72rem;
	font-weight: 600;
	letter-spacing: 0.03em;
	text-transform: uppercase;
	color: var(--muted);
	flex-shrink: 0;
}

/* ── Integrity Arc ─────────────────────────────────────────────── */
.integrity-arc {
	position: relative;
	display: inline-flex;
	align-items: center;
	justify-content: center;
}
.integrity-svg { width: 100%; height: 100%; }
.integrity-ring {
	transition: stroke-dashoffset 0.6s ease-out;
}
.integrity-label {
	position: absolute;
	font-family: var(--font-display);
	font-weight: 700;
	font-size: 1.15rem;
	letter-spacing: 0.03em;
}

/* ── Belief Card ───────────────────────────────────────────────── */
.belief-card {
	padding: 16px 18px;
	border: 1px solid var(--border);
	border-radius: 14px;
	background: var(--panel-strong);
	cursor: pointer;
	transition: transform 0.15s ease, box-shadow 0.15s ease;
	min-height: 72px;
	overflow-wrap: break-word;
	word-break: break-word;
}
.belief-card:hover {
	transform: translateY(-1px);
	box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}
.belief-claim {
	font-weight: 500;
	font-size: 1rem;
	line-height: 1.5;
	margin-bottom: 10px;
}
.belief-meta {
	display: flex; flex-wrap: wrap; gap: 6px;
	align-items: center;
	margin-top: 8px;
}
.belief-age {
	font-size: 0.78rem;
	color: var(--muted);
	margin-left: auto;
}
.belief-reasons {
	display: flex; flex-wrap: wrap; gap: 6px;
	margin-top: 8px;
}
.belief-bar-row {
	display: flex; align-items: center; gap: 10px;
	margin-top: 10px;
}

/* strength treatments */
.strength-strong { opacity: 1; border-color: var(--border); }
.strength-fading { opacity: 0.78; border-color: rgba(255, 200, 87, 0.3); }
.strength-faint  { opacity: 0.52; border-style: dashed; border-color: rgba(147, 164, 191, 0.3); }

/* ── Belief Actions ────────────────────────────────────────────── */
.belief-actions { margin-top: 12px; }
.action-row {
	display: flex; flex-wrap: wrap; gap: 8px;
	align-items: center;
}
.inline-form {
	display: grid; gap: 10px;
}
.ghost-claim {
	font-size: 0.88rem;
	color: var(--muted);
	text-decoration: line-through;
	padding: 8px 12px;
	border-radius: 8px;
	background: rgba(255, 255, 255, 0.03);
}
.delete-warn {
	font-size: 0.88rem;
	color: var(--danger);
}

/* ── Buttons ───────────────────────────────────────────────────── */
.btn {
	display: inline-flex; align-items: center; justify-content: center;
	min-height: 36px;
	min-width: 64px;
	padding: 6px 14px;
	border-radius: 8px;
	font-size: 0.82rem;
	font-weight: 600;
	border: 1px solid var(--border);
	transition: transform 0.1s ease, background 0.15s ease;
}
.btn:active { transform: scale(0.97); }
.btn-sm { min-height: 32px; min-width: 0; padding: 4px 12px; font-size: 0.78rem; }

.btn-primary { background: var(--accent); color: var(--bg); border-color: var(--accent); }
.btn-primary:hover { background: #4ec8e8; }
.btn-confirm { border-color: var(--success); color: var(--success); }
.btn-confirm:hover { background: rgba(114, 241, 184, 0.12); }
.btn-correct { border-color: var(--warn); color: var(--warn); }
.btn-correct:hover { background: rgba(255, 200, 87, 0.12); }
.btn-forget { border-color: var(--danger); color: var(--danger); }
.btn-forget:hover { background: rgba(255, 122, 144, 0.12); }
.btn-defer { border-color: var(--muted); color: var(--muted); }
.btn-defer:hover { background: rgba(147, 164, 191, 0.12); }
.btn-delete { border-color: var(--danger); color: var(--danger); }
.btn-muted { border-color: var(--border); color: var(--muted); }
.btn-muted:hover { background: rgba(147, 164, 191, 0.08); }

.btn:disabled {
	opacity: 0.4;
	cursor: not-allowed;
	transform: none;
}

/* ── Form inputs ───────────────────────────────────────────────── */
.inline-textarea, .inline-input, .capture-input {
	width: 100%;
	padding: 10px 14px;
	border: 1px solid var(--border);
	border-radius: 10px;
	background: rgba(255, 255, 255, 0.04);
	color: var(--text);
	font-size: 0.95rem;
	line-height: 1.5;
	resize: vertical;
	min-height: 40px;
	transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.inline-textarea:focus, .inline-input:focus, .capture-input:focus {
	border-color: var(--accent);
	box-shadow: 0 0 0 2px var(--accent-soft);
	outline: none;
}
.capture-input {
	font-size: 1.1rem;
	font-family: var(--font-body);
	min-height: 64px;
}

/* ── Form fields ───────────────────────────────────────────────── */
.form-field { display: grid; gap: 6px; }
.form-label {
	font-size: 0.78rem;
	font-weight: 600;
	letter-spacing: 0.03em;
	text-transform: uppercase;
	color: var(--muted);
}

.pill-selector { display: grid; gap: 6px; }
.pill-row { display: flex; flex-wrap: wrap; gap: 8px; }
.pill-btn {
	padding: 6px 14px;
	border: 1px solid var(--border);
	border-radius: 999px;
	font-size: 0.8rem;
	font-weight: 500;
	min-height: 36px;
	transition: all 0.15s ease;
}
.pill-btn:hover { background: var(--accent-soft); }
.pill-active {
	background: var(--accent-soft);
	border-color: var(--accent);
	color: var(--accent);
}

/* ── Empty state ───────────────────────────────────────────────── */
.empty-state {
	display: flex; flex-direction: column; align-items: center;
	padding: 48px 24px;
	text-align: center;
}
.empty-glyph {
	font-size: 2.5rem;
	margin-bottom: 16px;
	opacity: 0.5;
}
.empty-title {
	font-family: var(--font-body);
	font-weight: 600;
	font-size: 1rem;
	margin-bottom: 6px;
}
.empty-subtitle { color: var(--muted); font-size: 0.88rem; }

/* ── Distribution bar ──────────────────────────────────────────── */
.dist-bar-wrap { display: grid; gap: 8px; }
.dist-title {
	font-size: 0.78rem;
	font-weight: 600;
	letter-spacing: 0.03em;
	text-transform: uppercase;
	color: var(--muted);
}
.dist-track {
	display: flex;
	height: 24px;
	border-radius: 6px;
	overflow: hidden;
	background: rgba(255, 255, 255, 0.04);
}
.dist-segment {
	min-width: 4px;
	transition: width 0.3s ease;
}
.dist-legend {
	display: flex; flex-wrap: wrap; gap: 12px;
}
.dist-legend-item {
	display: inline-flex; align-items: center; gap: 6px;
	font-size: 0.75rem;
	color: var(--muted);
}
.dist-dot {
	width: 8px; height: 8px;
	border-radius: 50%;
	flex-shrink: 0;
}

/* ── Toast stack ───────────────────────────────────────────────── */
.toast-stack {
	position: fixed;
	right: 16px;
	bottom: 16px;
	z-index: 200;
	display: flex; flex-direction: column; gap: 8px;
	max-width: calc(100vw - 32px);
	pointer-events: none;
}
.toast {
	padding: 12px 18px;
	border-radius: 10px;
	font-size: 0.85rem;
	font-weight: 500;
	backdrop-filter: blur(12px);
	animation: slideInRight 0.3s ease-out;
	pointer-events: auto;
	max-width: 360px;
	overflow-wrap: break-word;
}
.toast-ok {
	background: rgba(114, 241, 184, 0.18);
	border: 1px solid rgba(114, 241, 184, 0.35);
	color: var(--success);
}
.toast-err {
	background: rgba(255, 122, 144, 0.18);
	border: 1px solid rgba(255, 122, 144, 0.35);
	color: var(--danger);
}
@keyframes slideInRight {
	from { transform: translateX(100%); opacity: 0; }
	to { transform: translateX(0); opacity: 1; }
}

/* ── Explainer banner ──────────────────────────────────────────── */
.explainer {
	padding: 14px 18px;
	border-radius: 12px;
	background: var(--accent-soft);
	border: 1px solid rgba(97, 218, 251, 0.2);
	font-size: 0.85rem;
	line-height: 1.6;
	color: var(--muted);
}
.explainer-link { font-weight: 600; }

/* ── Dashboard ─────────────────────────────────────────────────── */
.dash-top {
	display: grid;
	grid-template-columns: auto 1fr;
	gap: 20px;
	align-items: start;
}
.dash-integrity-inner {
	display: flex; align-items: center; gap: 20px;
}
.dash-integrity-meta { display: grid; gap: 4px; }
.dash-stat-label {
	font-size: 0.78rem; font-weight: 600;
	letter-spacing: 0.03em; text-transform: uppercase;
	color: var(--muted);
}
.dash-stat-detail { font-size: 0.85rem; color: var(--muted); }

.dash-stats-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
	gap: 12px;
}
.stat-card {
	padding: 16px;
	border: 1px solid var(--border);
	border-radius: 12px;
	background: var(--panel-strong);
	text-align: center;
	cursor: default;
	transition: transform 0.15s ease;
}
.stat-card[onclick] { cursor: pointer; }
.stat-card:hover { transform: translateY(-1px); }
.stat-value {
	display: block;
	font-family: var(--font-display);
	font-size: 1.8rem;
	font-weight: 700;
	line-height: 1.2;
	margin-bottom: 4px;
}
.stat-label {
	font-size: 0.75rem;
	font-weight: 600;
	letter-spacing: 0.03em;
	text-transform: uppercase;
	color: var(--muted);
}
.stat-success { color: var(--success); }
.stat-warn { color: var(--warn); }
.stat-fading { color: var(--warn); }
.stat-faint { color: var(--muted); }

/* ── Trends ────────────────────────────────────────────────────── */
.trends-row {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
	gap: 14px;
}
.trend-item { display: grid; gap: 2px; }
.trend-label {
	font-size: 0.72rem; font-weight: 600;
	letter-spacing: 0.03em; text-transform: uppercase;
	color: var(--muted);
}
.trend-value { font-size: 0.88rem; }
.trend-alert .trend-value { color: var(--warn); }

/* ── Capture page ──────────────────────────────────────────────── */
.capture-controls {
	display: flex; flex-wrap: wrap; gap: 20px;
	margin-top: 16px;
}
.capture-extra { margin-top: 12px; }
.capture-submit { margin-top: 16px; }
.capture-matches { display: grid; gap: 14px; }
.capture-match-card { display: grid; gap: 8px; }
.capture-match-actions {
	display: flex; flex-wrap: wrap; gap: 8px;
	padding: 0 4px;
}

/* ── Flags page ────────────────────────────────────────────────── */
.flags-list { display: grid; gap: 14px; }

/* ── Detail page ───────────────────────────────────────────────── */
.detail-header-panel { /* inherits panel */ }
.detail-claim {
	font-family: var(--font-display);
	font-weight: 700;
	font-size: clamp(1.1rem, 3.5vw, 1.4rem);
	line-height: 1.4;
	margin-bottom: 14px;
	overflow-wrap: break-word;
	word-break: break-word;
}
.detail-superseded {
	color: var(--muted);
	text-decoration: line-through;
}
.detail-status-row {
	display: flex; flex-wrap: wrap; gap: 8px;
	align-items: center;
}

.detail-metrics {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
	gap: 14px;
}
.metric-card {
	padding: 14px 16px;
	border: 1px solid var(--border);
	border-radius: 12px;
	background: var(--panel-strong);
	display: grid;
	gap: 6px;
}
.metric-label {
	font-size: 0.72rem; font-weight: 600;
	letter-spacing: 0.03em; text-transform: uppercase;
	color: var(--muted);
}
.metric-value {
	font-family: var(--font-display);
	font-size: 1.5rem;
	font-weight: 700;
	line-height: 1.2;
}
.metric-sublabel { font-size: 0.75rem; color: var(--muted); }
.metric-value-text { font-size: 0.92rem; font-weight: 500; }

.detail-provenance {
	font-family: var(--font-mono);
	font-size: 0.82rem;
	color: var(--muted);
	padding: 10px 14px;
	border-radius: 8px;
	background: rgba(255, 255, 255, 0.03);
	overflow-wrap: break-word;
}
.provenance-label {
	font-weight: 600;
	color: var(--accent);
}

/* ── Version diff ──────────────────────────────────────────────── */
.version-diff { display: grid; gap: 8px; }
.diff-before {
	padding: 10px 14px;
	border-radius: 8px;
	background: rgba(255, 122, 144, 0.1);
	border-left: 3px solid var(--danger);
	text-decoration: line-through;
	color: var(--danger);
	font-size: 0.88rem;
	overflow-wrap: break-word;
}
.diff-after {
	padding: 10px 14px;
	border-radius: 8px;
	background: rgba(114, 241, 184, 0.1);
	border-left: 3px solid var(--success);
	color: var(--success);
	font-size: 0.88rem;
	overflow-wrap: break-word;
}

/* ── Lineage timeline ──────────────────────────────────────────── */
.lineage-timeline {
	display: grid;
	gap: 0;
	padding-left: 16px;
	border-left: 2px solid var(--border);
}
.lineage-node {
	display: flex; align-items: flex-start; gap: 12px;
	padding: 10px 0;
	position: relative;
	cursor: pointer;
	transition: background 0.15s ease;
}
.lineage-node:hover { background: rgba(255, 255, 255, 0.02); }
.lineage-marker {
	width: 10px; height: 10px;
	border-radius: 50%;
	border: 2px solid var(--accent);
	background: var(--bg);
	flex-shrink: 0;
	margin-top: 5px;
	margin-left: -22px;
}
.lineage-current .lineage-marker {
	background: var(--accent);
}
.lineage-superseded .lineage-claim {
	text-decoration: line-through;
	color: var(--muted);
}
.lineage-body { display: grid; gap: 2px; min-width: 0; }
.lineage-claim {
	font-size: 0.88rem;
	font-weight: 500;
	overflow-wrap: break-word;
}
.lineage-time { font-size: 0.75rem; color: var(--muted); }

/* ── Proximity row ─────────────────────────────────────────────── */
.prox-row {
	display: grid; gap: 8px;
	padding-bottom: 12px;
	border-bottom: 1px solid var(--border);
}
.prox-row:last-child { border-bottom: none; padding-bottom: 0; }
.prox-actions {
	display: flex; align-items: center; gap: 12px;
	padding: 0 4px;
}
.prox-sim {
	font-size: 0.78rem;
	color: var(--muted);
	font-weight: 600;
}

/* ── Log page ──────────────────────────────────────────────────── */
.log-list { display: grid; gap: 2px; }
.log-entry {
	display: flex; align-items: center; gap: 12px;
	padding: 12px 16px;
	border-radius: 10px;
	cursor: pointer;
	transition: background 0.15s ease;
	min-height: 44px;
}
.log-entry:hover { background: rgba(255, 255, 255, 0.04); }
.log-claim {
	flex: 1;
	font-size: 0.88rem;
	font-weight: 500;
	overflow-wrap: break-word;
	word-break: break-word;
	min-width: 0;
}
.log-time {
	font-size: 0.75rem;
	color: var(--muted);
	flex-shrink: 0;
	text-align: right;
}

/* ── Responsive: tablet ────────────────────────────────────────── */
@media (max-width: 900px) {
	.sidebar {
		transform: translateX(-100%);
		transition: transform 0.25s ease;
		box-shadow: none;
	}
	.sidebar-open {
		transform: translateX(0);
		box-shadow: 8px 0 32px rgba(0, 0, 0, 0.5);
	}
	.sidebar-backdrop {
		display: block;
		position: fixed;
		inset: 0;
		z-index: 99;
		background: rgba(0, 0, 0, 0.5);
		opacity: 1;
		transition: opacity 0.2s ease;
	}
	.hamburger {
		display: flex;
		align-items: center;
		justify-content: center;
		position: fixed;
		top: 14px; left: 14px;
		z-index: 101;
		width: 40px; height: 40px;
		border-radius: 10px;
		background: var(--panel-strong);
		border: 1px solid var(--border);
		font-size: 1.2rem;
		color: var(--text);
	}
	.main-content {
		margin-left: 0;
		padding: 64px 16px 80px;
	}
}

/* ── Responsive: mobile ────────────────────────────────────────── */
@media (max-width: 600px) {
	.main-content { padding: 60px 12px 80px; }
	.panel { padding: 18px; }
	.belief-card { padding: 14px 14px; }
	.dash-top { grid-template-columns: 1fr; }
	.dash-stats-grid { grid-template-columns: repeat(2, 1fr); }
	.detail-metrics { grid-template-columns: repeat(2, 1fr); }
	.capture-controls { flex-direction: column; gap: 14px; }
	.trends-row { grid-template-columns: 1fr; }
	.log-entry { padding: 10px 12px; }
}
`;

const FAVICON = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect x='3' y='3' width='58' height='58' rx='10' fill='%230a0d12' stroke='%2361dafb' stroke-width='3'/><path d='M20 18h16c7.18 0 12 4.64 12 11.19 0 4.65-2.49 8.22-6.88 10.06L47 46H36.34l-4.8-5.3H29V46H20V18zm9 7v9h6.25c2.41 0 3.9-1.72 3.9-4.48 0-2.92-1.54-4.52-4.34-4.52H29z' fill='%2361dafb'/></svg>`;

function writeHtmlShell() {
	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Codex — Belief Console</title>
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
