import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { cpus, platform, release, tmpdir } from 'node:os';
import { join } from 'node:path';
import { performance } from 'node:perf_hooks';
import { DatabaseSync } from 'node:sqlite';
import * as api from '../../dist/index.js';
import * as mcp from '../../dist/mcp.js';
import { createServer, hotPaths, searchRequest, seedClaim } from '../guard/config.mjs';
import { coldStarts } from '../guard/startup.mjs';

const temp = mkdtempSync(join(tmpdir(), 'library-bench-'));
const rows = [];
const metadata = { node: process.version, cpu: cpus()[0].model, os: `${platform()} ${release()}` };
function randomSource() {
	let state = 42;
	return () => {
		state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
		return state / 4294967296;
	};
}
function row(database, operation, samples) {
	samples.sort((a, b) => a - b);
	return {
		database,
		operation,
		p50Ms: samples[Math.floor(samples.length * 0.5)],
		p95Ms: samples[Math.min(samples.length - 1, Math.floor(samples.length * 0.95))],
		opsPerSecond: (1000 * samples.length) / samples.reduce((a, b) => a + b, 0),
	};
}
try {
	for (const [database, path] of [
		['memory', ':memory:'],
		['file', join(temp, 'bench.db')],
	]) {
		const db = new DatabaseSync(path);
		try {
			db.exec('PRAGMA journal_mode=WAL;');
			api.initCodexTables(db);
			const random = randomSource();
			const start = performance.now();
			// Bulk fixture creation excludes proximity scans; the timed write path below includes them.
			for (let i = 0; i < 10000; i++)
				api.write.remember(db, seedClaim(i, random), { skipProximity: true });
			const seed = row(database, 'seed 10,000', [performance.now() - start]);
			seed.opsPerSecond *= 10000;
			rows.push(seed);
			const server = createServer(mcp, db);
			for (const [operation, fn] of Object.entries(hotPaths(api, db, server))) {
				for (let i = 0; i < 3; i++) await fn(i);
				const samples = [];
				for (let i = 0; i < 30; i++) {
					const before = performance.now();
					const value = await fn(i + 3);
					assert.ok(value);
					samples.push(performance.now() - before);
				}
				rows.push(row(database, operation, samples));
			}
		} finally {
			db.close();
		}
	}
	const cold = await coldStarts(join(temp, 'bench.db'), searchRequest);
	for (const [operation, value] of Object.entries(cold))
		rows.push(row('process', operation, value.samples));
	console.log(`Node ${metadata.node}; ${metadata.cpu}; ${metadata.os}\n`);
	console.log('| Database | Operation | p50 ms | p95 ms | ops/s |\n|---|---|---:|---:|---:|');
	for (const value of rows)
		console.log(
			`| ${value.database} | ${value.operation} | ${value.p50Ms.toFixed(2)} | ${value.p95Ms.toFixed(2)} | ${value.opsPerSecond.toFixed(1)} |`,
		);
	writeFileSync('bench-results.json', `${JSON.stringify({ metadata, rows }, null, 2)}\n`);
} finally {
	rmSync(temp, { recursive: true, force: true });
}
