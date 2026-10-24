import {
	isErrorResult as defaultIsErrorResult,
	type McpServer,
	type SurfaceTool,
	type ToolAnnotations,
} from './surface_types.ts';
import { validateInput } from './validate_input.ts';

export const MCP_LATEST_PROTOCOL_VERSION = '2026-07-28';
export const MCP_SUPPORTED_PROTOCOL_VERSIONS = [
	MCP_LATEST_PROTOCOL_VERSION,
	'2025-11-25',
	'2025-06-18',
	'2025-03-26',
	'2024-11-05',
] as const;
export interface McpServerOptions<TCtx> {
	name: string;
	version: string;
	title?: string;
	description?: string;
	instructions?: string;
	tools: readonly SurfaceTool<TCtx>[];
	context: () => TCtx | Promise<TCtx>;
	annotations?: (tool: SurfaceTool<TCtx>) => ToolAnnotations;
	isErrorResult?: (result: unknown) => boolean;
}
export function createMcpServer<TCtx>(options: McpServerOptions<TCtx>): McpServer {
	let initialized = false;
	let context: Promise<TCtx> | undefined;
	const serverInfo = { name: options.name, version: options.version };
	const record = (value: unknown): value is Record<string, unknown> =>
		typeof value === 'object' && value !== null && !Array.isArray(value);
	const error = (id: unknown, code: number, message: string, data?: unknown) => ({
		jsonrpc: '2.0',
		id,
		error: { code, message, ...(data === undefined ? {} : { data }) },
	});
	const handleMessage = async (msg: unknown): Promise<object | undefined> => {
		if (
			!record(msg) ||
			msg.jsonrpc !== '2.0' ||
			typeof msg.method !== 'string' ||
			(Object.hasOwn(msg, 'id') &&
				msg.id !== null &&
				typeof msg.id !== 'string' &&
				typeof msg.id !== 'number')
		)
			return error(null, -32600, 'Invalid Request');
		if (!Object.hasOwn(msg, 'id')) return undefined;
		const id = msg.id;
		if (msg.params !== undefined && !record(msg.params)) return error(id, -32602, 'Invalid params');
		const params = record(msg.params) ? msg.params : {};
		const meta = record(params._meta) ? params._meta : {};
		const requested = meta['io.modelcontextprotocol/protocolVersion'];
		const modern = requested !== undefined;
		if (
			modern &&
			!MCP_SUPPORTED_PROTOCOL_VERSIONS.includes(
				requested as (typeof MCP_SUPPORTED_PROTOCOL_VERSIONS)[number],
			)
		)
			return error(id, -32022, 'Unsupported protocol version', {
				supported: [...MCP_SUPPORTED_PROTOCOL_VERSIONS],
				requested,
			});
		const result = (value: object) => ({
			jsonrpc: '2.0',
			id,
			result: modern
				? {
						...value,
						resultType: 'complete',
						_meta: { 'io.modelcontextprotocol/serverInfo': serverInfo },
					}
				: value,
		});
		if (!modern && msg.method === 'initialize') {
			initialized = true;
			const version =
				MCP_SUPPORTED_PROTOCOL_VERSIONS.slice(1).find((v) => v === params.protocolVersion) ??
				'2025-11-25';
			return result({
				protocolVersion: version,
				capabilities: { tools: { listChanged: false } },
				serverInfo: { ...serverInfo, ...(options.title ? { title: options.title } : {}) },
				...(options.instructions ? { instructions: options.instructions } : {}),
			});
		}
		if (!modern && !initialized)
			return error(
				id,
				-32602,
				`Protocol version required. Supported versions: ${MCP_SUPPORTED_PROTOCOL_VERSIONS.join(', ')}`,
			);
		if (modern && !record(meta['io.modelcontextprotocol/clientCapabilities']))
			return error(id, -32602, 'clientCapabilities must be an object');
		switch (msg.method) {
			case 'ping':
				return result({});
			case 'server/discover':
				return result({
					supportedVersions: [...MCP_SUPPORTED_PROTOCOL_VERSIONS],
					capabilities: { tools: {} },
					...(options.instructions ? { instructions: options.instructions } : {}),
					ttlMs: 60000,
					cacheScope: 'public',
				});
			case 'tools/list':
				return result({
					tools: options.tools.map((tool) => ({
						name: tool.name,
						...(tool.title ? { title: tool.title } : {}),
						description:
							tool.description +
							(tool.whenToUse ? `\n\nUse when: ${tool.whenToUse}` : '') +
							(tool.whenNotToUse ? `\nNot for: ${tool.whenNotToUse}` : ''),
						inputSchema: tool.inputSchema,
						annotations: options.annotations?.(tool) ?? {
							readOnlyHint: tool.readOnly ?? false,
							destructiveHint: !tool.readOnly,
							idempotentHint: tool.readOnly ?? false,
							openWorldHint: false,
						},
					})),
					...(modern ? { ttlMs: 60000, cacheScope: 'public' } : {}),
				});
			case 'tools/call': {
				const tool = options.tools.find((tool) => tool.name === params.name);
				if (!tool) return error(id, -32602, `Unknown tool: ${String(params.name)}`);
				const input = params.arguments === undefined ? {} : params.arguments;
				const errors = validateInput(tool.inputSchema, input);
				if (errors.length)
					return result({ content: [{ type: 'text', text: errors.join('\n') }], isError: true });
				try {
					context ??= Promise.resolve().then(options.context);
					const value = await tool.handler(await context, input as Record<string, unknown>);
					return result({
						content: [{ type: 'text', text: JSON.stringify(value) ?? 'null' }],
						...(record(value) ? { structuredContent: value } : {}),
						isError: (options.isErrorResult ?? defaultIsErrorResult)(value),
					});
				} catch (cause) {
					return result({
						content: [
							{ type: 'text', text: cause instanceof Error ? cause.message : String(cause) },
						],
						isError: true,
					});
				}
			}
			default:
				return error(id, -32601, 'Method not found');
		}
	};
	return {
		handleMessage,
		async handleLine(line) {
			let msg: unknown;
			try {
				msg = JSON.parse(line);
			} catch {
				return JSON.stringify(error(null, -32700, 'Parse error'));
			}
			const response = await handleMessage(msg);
			return response === undefined ? undefined : JSON.stringify(response);
		},
	};
}
