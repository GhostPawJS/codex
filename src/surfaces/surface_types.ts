export interface JsonSchema {
	type?: string | readonly string[] | undefined;
	description?: string | undefined;
	properties?: Record<string, JsonSchema> | undefined;
	required?: readonly string[] | undefined;
	enum?: readonly unknown[] | undefined;
	items?: JsonSchema | undefined;
	oneOf?: readonly JsonSchema[] | undefined;
}
export interface SurfaceTool<TCtx> {
	name: string;
	title?: string;
	description: string;
	inputSchema: JsonSchema & { type: 'object' };
	whenToUse?: string;
	whenNotToUse?: string;
	readOnly?: boolean;
	sideEffects?: string;
	handler(ctx: TCtx, input: Record<string, unknown>): unknown | Promise<unknown>;
}
export interface ToolAnnotations {
	readOnlyHint: boolean;
	destructiveHint: boolean;
	idempotentHint: boolean;
	openWorldHint: boolean;
}
export interface JsonRpcRequest {
	jsonrpc: '2.0';
	id?: string | number | null;
	method: string;
	params?: Record<string, unknown>;
}
export interface JsonRpcError {
	code: number;
	message: string;
	data?: unknown;
}
export type JsonRpcResponse = {
	jsonrpc: '2.0';
	id: string | number | null;
} & ({ result: object } | { error: JsonRpcError });
export interface McpServer {
	handleMessage(msg: unknown): Promise<object | undefined>;
	handleLine(line: string): Promise<string | undefined>;
}
export function isErrorResult(result: unknown): boolean {
	return typeof result === 'object' && result !== null && 'ok' in result && result.ok === false;
}
