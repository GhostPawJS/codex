import assert from 'node:assert/strict';
import { Readable, Writable } from 'node:stream';
import { test } from 'node:test';
import { serveMcpStdio } from './mcp_stdio.ts';

test('stdio splits UTF-8 chunks, CRLF and blank lines and preserves response order', async () => {
	let text = '';
	const input = Readable.from([
		Buffer.from('one\r\n\n'),
		...[...Buffer.from('ä\nlast')].map((byte) => Buffer.from([byte])),
	]);
	const output = new Writable({
		write(chunk, _encoding, callback) {
			text += String(chunk);
			callback();
		},
	});
	const seen: string[] = [];
	await serveMcpStdio(
		{
			handleMessage: async () => undefined,
			handleLine: async (line) => {
				seen.push(line);
				await Promise.resolve();
				return line === 'last' ? undefined : JSON.stringify(line);
			},
		},
		{ input, output },
	);
	assert.deepEqual(seen, ['one', 'ä', 'last']);
	assert.equal(text, '"one"\n"ä"\n');
});
