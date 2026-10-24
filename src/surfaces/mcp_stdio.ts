import type { Readable, Writable } from 'node:stream';
import type { McpServer } from './surface_types.ts';

export async function serveMcpStdio(
	server: McpServer,
	options: { input?: Readable; output?: Writable } = {},
): Promise<void> {
	const input = options.input ?? process.stdin;
	const output = options.output ?? process.stdout;
	input.setEncoding('utf8');
	let buffer = '';
	const respond = async (line: string) => {
		if (!line.trim()) return;
		const response = await server.handleLine(line.replace(/\r$/, ''));
		if (response !== undefined)
			await new Promise<void>((resolve, reject) =>
				output.write(`${response}\n`, (error) => (error ? reject(error) : resolve())),
			);
	};
	for await (const chunk of input) {
		buffer += String(chunk);
		let end = buffer.indexOf('\n');
		while (end !== -1) {
			const line = buffer.slice(0, end);
			buffer = buffer.slice(end + 1);
			await respond(line);
			end = buffer.indexOf('\n');
		}
	}
	await respond(buffer);
}
