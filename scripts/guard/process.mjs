import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { closeSync, mkdtempSync, openSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { performance } from 'node:perf_hooks';

// File-backed stdio also works in runners that prohibit socketpair-backed child pipes.
function capture() {
	const dir = mkdtempSync(join(tmpdir(), 'guard-process-'));
	const paths = ['input', 'output', 'error'].map((name) => join(dir, name));
	for (const path of paths) writeFileSync(path, '');
	const descriptors = paths.map((path, i) => openSync(path, i === 0 ? 'r' : 'w'));
	return {
		paths,
		descriptors,
		close() {
			for (const fd of descriptors) closeSync(fd);
			rmSync(dir, { recursive: true, force: true });
		},
	};
}
export function run(command, args, options = {}) {
	const io = capture();
	try {
		const result = spawnSync(command, args, { timeout: 30000, ...options, stdio: io.descriptors });
		const stdout = readFileSync(io.paths[1], 'utf8');
		const stderr = readFileSync(io.paths[2], 'utf8');
		assert.ifError(result.error);
		assert.equal(result.status, 0, `${command}: ${stderr}\n${stdout}`);
		return stdout;
	} finally {
		io.close();
	}
}
export function session(command, args, requests, options = {}) {
	return new Promise((resolve, reject) => {
		const io = capture();
		writeFileSync(
			io.paths[0],
			`${requests.map((request) => JSON.stringify(request)).join('\n')}\n`,
		);
		const start = performance.now();
		const child = spawn(command, args, { ...options, stdio: io.descriptors });
		let done = false;
		const timer = setTimeout(() => finish(new Error('MCP response timeout')), 10000);
		const poll = setInterval(read, 1);
		function finish(error, replies) {
			if (done) return;
			done = true;
			clearTimeout(timer);
			clearInterval(poll);
			const ms = performance.now() - start;
			child.kill();
			io.close();
			if (error) reject(error);
			else resolve({ replies, ms });
		}
		function read(exited = false) {
			try {
				const lines = readFileSync(io.paths[1], 'utf8').split('\n');
				lines.pop();
				const replies = lines.map((line) => JSON.parse(line));
				for (const reply of replies) {
					assert.ok(!reply.error, JSON.stringify(reply));
					assert.ok(reply.result);
					assert.ok(!reply.result.isError, JSON.stringify(reply));
				}
				if (replies.length === requests.length) finish(null, replies);
				else if (exited)
					finish(new Error(`MCP exited before response: ${readFileSync(io.paths[2], 'utf8')}`));
			} catch (error) {
				finish(error);
			}
		}
		child.on('error', (error) => finish(error));
		child.on('exit', () => {
			if (!done) read(true);
		});
	});
}
export const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
