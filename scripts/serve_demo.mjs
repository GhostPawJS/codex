import { readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import process from 'node:process';

const demoDir = path.join(process.cwd(), 'demo');
const indexPath = path.join(demoDir, 'index.html');
const port = Number(process.env.PORT ?? '4173');

const mimeTypes = new Map([
	['.css', 'text/css; charset=utf-8'],
	['.html', 'text/html; charset=utf-8'],
	['.js', 'text/javascript; charset=utf-8'],
	['.json', 'application/json; charset=utf-8'],
	['.map', 'application/json; charset=utf-8'],
	['.svg', 'image/svg+xml'],
	['.wasm', 'application/wasm'],
]);

function resolveMimeType(filePath) {
	return mimeTypes.get(path.extname(filePath)) ?? 'application/octet-stream';
}

function isInsideDemoDir(filePath) {
	const relative = path.relative(demoDir, filePath);
	return relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative);
}

async function tryReadFile(filePath) {
	const fileStat = await stat(filePath);
	if (fileStat.isDirectory()) {
		return readFile(path.join(filePath, 'index.html'));
	}
	return readFile(filePath);
}

const server = createServer(async (request, response) => {
	try {
		const requestUrl = new URL(request.url ?? '/', 'http://localhost');
		const pathname =
			requestUrl.pathname === '/' ? '/index.html' : decodeURIComponent(requestUrl.pathname);
		const filePath = path.normalize(path.join(demoDir, pathname));

		if (filePath !== demoDir && !isInsideDemoDir(filePath)) {
			response.writeHead(403).end('Forbidden');
			return;
		}

		try {
			const body = await tryReadFile(filePath);
			response.writeHead(200, {
				'Content-Type': resolveMimeType(filePath),
				'Cache-Control': 'no-store',
			});
			response.end(body);
			return;
		} catch {
			const body = await readFile(indexPath);
			response.writeHead(200, {
				'Content-Type': 'text/html; charset=utf-8',
				'Cache-Control': 'no-store',
			});
			response.end(body);
		}
	} catch (error) {
		response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
		response.end(error instanceof Error ? error.message : 'Failed to serve demo output.');
	}
});

server.listen(port, () => {
	console.log(`Codex demo served at http://localhost:${String(port)}`);
});
