import { readFileSync } from 'node:fs';

export type CliValueType = 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'json';
export interface CliArgument {
	name: string;
	type: CliValueType;
	short?: string;
	description?: string | undefined;
	enum?: readonly unknown[] | undefined;
	required?: boolean;
	variadic?: boolean;
	itemType?: CliValueType;
	parseValue?: ((raw: string) => unknown) | undefined;
}
export interface CliSpec {
	command: string;
	description?: string;
	flags?: readonly CliArgument[];
	positionals?: readonly CliArgument[];
}
export class CliUsageError extends Error {
	readonly exitCode = 2;
}
const keyOf = (name: string) => name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
export function parseCliArgs(argv: string[], spec: CliSpec): Record<string, unknown> {
	const values: Record<string, unknown> = {};
	const positions: string[] = [];
	const flags = spec.flags ?? [];
	const convert = (raw: string, arg: CliArgument): unknown => {
		let value = raw;
		if (raw.startsWith('@')) {
			try {
				value = readFileSync(raw.slice(1), 'utf8');
			} catch {
				throw new CliUsageError(`Cannot read value file: ${raw.slice(1)}`);
			}
		}
		if (arg.parseValue) return arg.parseValue(value);
		let result: unknown = value;
		if (arg.type === 'number' || arg.type === 'integer') {
			result = Number(value);
			if (
				!value.trim() ||
				!Number.isFinite(result) ||
				(arg.type === 'integer' && !Number.isInteger(result))
			)
				throw new CliUsageError(`Expected ${arg.type} for ${arg.name}: ${value}`);
		} else if (arg.type === 'boolean') {
			if (!['true', 'false'].includes(value))
				throw new CliUsageError(`Expected boolean for ${arg.name}`);
			result = value === 'true';
		} else if (arg.type === 'json') {
			try {
				result = JSON.parse(value);
			} catch {
				throw new CliUsageError(`Invalid JSON for ${arg.name}`);
			}
		}
		if (arg.enum && !arg.enum.includes(result))
			throw new CliUsageError(`${arg.name} must be one of: ${arg.enum.join(', ')}`);
		return result;
	};
	let ended = false;
	for (let i = 0; i < argv.length; i++) {
		const token = argv[i] as string;
		if (!ended && token === '--') {
			ended = true;
			continue;
		}
		if (ended || token === '-' || !token.startsWith('-')) {
			positions.push(token);
			continue;
		}
		const [flag, inline] = token.split(/=(.*)/s);
		const negative = flag?.startsWith('--no-');
		const name = flag?.replace(/^--?/, '').replace(/^no-/, '');
		const arg = flags.find(
			(entry) => entry.name === name || keyOf(entry.name) === name || entry.short === name,
		);
		if (!arg) {
			const prefix = (name ?? '').slice(0, 3);
			const suggestion = prefix ? flags.find((entry) => entry.name.startsWith(prefix)) : undefined;
			throw new CliUsageError(
				`Unknown flag: ${flag}${suggestion ? `; did you mean --${suggestion.name}?` : ''}. Allowed flags: ${flags.map((entry) => `--${entry.name}`).join(', ') || '(none)'}`,
			);
		}
		if (negative && arg.type !== 'boolean')
			throw new CliUsageError(`--no-${arg.name} requires a boolean flag`);
		let raw = inline;
		if (arg.type === 'boolean' && raw === undefined) raw = negative ? 'false' : 'true';
		if (raw === undefined) {
			const next = argv[i + 1];
			if (next === undefined || /^--[a-z]/i.test(next))
				throw new CliUsageError(`Missing value: --${arg.name}`);
			raw = next;
			i++;
		}
		const key = keyOf(arg.name);
		if (arg.type === 'array') {
			const item = convert(raw, { ...arg, type: arg.itemType ?? 'string' });
			values[key] = [...((values[key] as unknown[]) ?? []), item];
		} else values[key] = convert(raw, arg);
	}
	let index = 0;
	for (const arg of spec.positionals ?? []) {
		if (index >= positions.length) continue;
		values[keyOf(arg.name)] = arg.variadic
			? positions
					.slice(index)
					.map((value) => convert(value, { ...arg, type: arg.itemType ?? arg.type }))
			: convert(positions[index] as string, arg);
		index = arg.variadic ? positions.length : index + 1;
	}
	if (index < positions.length)
		throw new CliUsageError(`Unexpected positional: ${positions[index]}`);
	for (const arg of [...flags, ...(spec.positionals ?? [])]) {
		if (arg.required && values[keyOf(arg.name)] === undefined)
			throw new CliUsageError(`Missing required argument: ${arg.name}`);
	}
	return values;
}
export function renderCliHelp(spec: CliSpec): string {
	const describe = (arg: CliArgument) =>
		`${arg.type}${arg.enum ? ` (${arg.enum.join('|')})` : ''}${arg.required ? ' required' : ''}  ${arg.description ?? ''}`;
	return `Usage: ${spec.command} ${(spec.positionals ?? []).map((arg) => `<${arg.name}${arg.variadic ? '...' : ''}>`).join(' ')} [flags]\n${spec.description ?? ''}\n\nPositionals:\n${(spec.positionals ?? []).map((arg) => `  ${arg.name}  ${describe(arg)}`).join('\n')}\nFlags:\n${(spec.flags ?? []).map((arg) => `  --${arg.name}${arg.short ? `, -${arg.short}` : ''}  ${describe(arg)}`).join('\n')}\n`;
}
