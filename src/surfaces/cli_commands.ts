import type { ToolCliOptions } from './cli.ts';
import {
	type CliArgument,
	type CliSpec,
	CliUsageError,
	parseCliArgs,
	renderCliHelp,
} from './cli_args.ts';
import { cliVersion } from './cli_version.ts';
import type { JsonSchema, SurfaceTool } from './surface_types.ts';
import { validateInput } from './validate_input.ts';

export function cliCommands<T>(tools: readonly SurfaceTool<T>[]) {
	return tools.flatMap((tool) => {
		const split = tool.name.indexOf('_');
		const cli = tool.cli ?? { noun: tool.name.slice(split + 1), verb: tool.name.slice(0, split) };
		const action =
			cli.action ??
			(tool.inputSchema.properties?.action?.enum ? { property: 'action' } : undefined);
		const actions = action
			? (tool.inputSchema.properties?.[action.property]?.enum ?? [])
			: [undefined];
		return actions.map((value) => {
			const verb =
				value === undefined ? cli.verb : (action?.verbs?.[String(value)] ?? String(value));
			return {
				tool,
				path: [cli.noun, verb].filter(Boolean).join(' '),
				fixed: action && value !== undefined ? { [action.property]: value } : {},
				positionals: action?.positionals?.[String(value)] ?? cli.positionals ?? [],
			};
		});
	});
}
export async function runCliCommand<T>(
	argv: string[],
	options: ToolCliOptions<T>,
): Promise<number | undefined> {
	const stdout = options.stdout ?? process.stdout;
	const stderr = options.stderr ?? process.stderr;
	const stdin = options.stdin ?? process.stdin;
	const args = [...argv];
	const tree = cliCommands(options.tools);
	let json = argv.includes('--json'),
		quiet = argv.includes('--quiet'),
		compact = false,
		help = false;
	let db: string | undefined;
	const fail = (message: string, code: number) => {
		stderr.write(`${message}\n`);
		if (json && !quiet)
			stdout.write(
				`${JSON.stringify({ ok: false, error: { code: code === 2 ? 'usage_error' : 'internal_error', message } })}\n`,
			);
		return code;
	};
	const legacy = ['tools', 'describe', 'call', 'mcp', 'skill'];
	let first: string | undefined;
	for (let i = 0; i < argv.length; i++) {
		const token = argv[i] as string;
		if (token === '--db') {
			i++;
			continue;
		}
		if (token.startsWith('-')) continue;
		first = token;
		break;
	}
	if (
		legacy.includes(first ?? '') ||
		options.tools.some((tool) => tool.name.replace(/[-_]/g, '') === first?.replace(/[-_]/g, ''))
	)
		return undefined;
	try {
		for (let i = 0; i < args.length; i++) {
			const flag = args[i];
			if (flag === '--') break;
			if (flag === '--db' || flag?.startsWith('--db=')) {
				db = flag === '--db' ? args.splice(i + 1, 1)[0] : flag.slice(5);
				if (!db || db.startsWith('--')) throw new CliUsageError('--db requires a path');
			} else if (flag === '--json') json = true;
			else if (flag === '--quiet') quiet = true;
			else if (flag === '--compact') compact = true;
			else if (flag === '--help' || flag === '-h') help = true;
			else if (['--version', '-V', '-v'].includes(flag ?? '')) {
				if (!quiet) stdout.write(`${cliVersion(options.version)}\n`);
				return 0;
			} else if (flag !== '--no-color') continue;
			args.splice(i--, 1);
		}
		if (args[0] === 'version') {
			if (!quiet) stdout.write(`${cliVersion(options.version)}\n`);
			return 0;
		}
		if (args[0] === 'help') {
			help = true;
			args.shift();
		}
		if (!args.length) help = true;
		const entry = tree.find((command) =>
			command.path.split(' ').every((part, i) => args[i] === part),
		);
		const specFor = (command: (typeof tree)[number]): CliSpec => {
			const argument = (name: string, schema: JsonSchema): CliArgument => ({
				name,
				type:
					schema.type === 'object' || !schema.type ? 'json' : (schema.type as CliArgument['type']),
				description: schema.description,
				enum: schema.enum,
				...(schema.items?.type ? { itemType: schema.items.type as CliArgument['type'] } : {}),
			});
			const properties = command.tool.inputSchema.properties ?? {};
			return {
				command: `${options.bin} ${command.path}`,
				description: command.tool.description,
				positionals: command.positionals.map((name) => ({
					...argument(name, properties[name] ?? {}),
					...(properties[name]?.type === 'array'
						? {
								type: (properties[name]?.items?.type as CliArgument['type']) ?? 'string',
								variadic: true,
							}
						: {}),
				})),
				flags: Object.entries(properties)
					.filter(([name]) => !(name in command.fixed))
					.map(([name, schema]) => ({
						...argument(
							name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`),
							schema,
						),
						required: false,
						description: `${schema.description ?? ''}${command.tool.inputSchema.required?.includes(name) ? ' (required)' : ''}`,
					})),
			};
		};
		if (help) {
			const matches = tree.filter((command) => command.path.startsWith(args.join(' ')));
			if (!matches.length) throw new CliUsageError(`Unknown command: ${args.join(' ')}`);
			if (!quiet)
				stdout.write(
					entry
						? renderCliHelp(specFor(entry))
						: `${options.bin} ${options.version}\n${options.description}\n\nCommands:\n${matches.map((command) => `  ${command.path}`).join('\n')}\n  mcp, skill, tools [--json], describe <tool>, call <tool> [JSON|-], completions <bash|zsh|fish>, version\nGlobal flags: --db <path>, --json, --quiet, --compact, --help/-h, --version/-V/-v, --no-color\n`,
				);
			return 0;
		}
		if (args[0] === 'completions') {
			const shell = args[1];
			if (!['bash', 'zsh', 'fish'].includes(shell ?? ''))
				throw new CliUsageError('Expected completion shell: bash, zsh or fish');
			if (quiet) return 0;
			const words = [...new Set(tree.flatMap((command) => command.path.split(' ')))].concat([
				'mcp',
				'skill',
				'tools',
				'describe',
				'call',
				'completions',
				'version',
			]);
			if (shell === 'bash') stdout.write(`complete -W '${words.join(' ')}' ${options.bin}\n`);
			else if (shell === 'zsh')
				stdout.write(`#compdef ${options.bin}\n_arguments '*:command:(${words.join(' ')})'\n`);
			else if (shell === 'fish')
				stdout.write(`complete -c ${options.bin} -f -a '${words.join(' ')}'\n`);
			else throw new CliUsageError('Expected completion shell: bash, zsh or fish');
			return 0;
		}
		if (!entry) throw new CliUsageError(`Unknown command: ${args.join(' ')}`);
		const rest = args.slice(entry.path.split(' ').length);
		let base: unknown = {};
		const spec = specFor(entry);
		const positionalIndexes: number[] = [];
		let ended = false;
		for (let i = 0; i < rest.length; i++) {
			const token = rest[i] as string;
			if (!ended && token === '--') {
				ended = true;
				continue;
			}
			if (!ended && token.startsWith('--')) {
				const flag = spec.flags?.find((arg) => `--${arg.name}` === token);
				if (!token.includes('=') && flag && flag.type !== 'boolean') i++;
			} else positionalIndexes.push(i);
		}
		const stdinIndex =
			positionalIndexes.length === 1 && rest[positionalIndexes[0] as number] === '-'
				? positionalIndexes[0]
				: undefined;
		if (stdinIndex !== undefined || (!rest.length && !stdin.isTTY)) {
			if (stdinIndex !== undefined) rest.splice(stdinIndex, 1);
			let raw = '';
			for await (const chunk of stdin) raw += String(chunk);
			try {
				base = raw.trim() ? JSON.parse(raw) : {};
			} catch {
				throw new CliUsageError('Invalid stdin JSON');
			}
			if (!base || typeof base !== 'object' || Array.isArray(base))
				throw new CliUsageError('Expected stdin JSON object');
		}
		const input = { ...(base as object), ...parseCliArgs(rest, spec), ...entry.fixed };
		const errors = validateInput(entry.tool.inputSchema, input);
		if (errors.length) throw new CliUsageError(errors.join('\n'));
		const context = await options.openContext(db === undefined ? {} : { db });
		try {
			const result = await entry.tool.handler(context, input);
			const record = result as {
				ok?: boolean;
				outcome?: string;
				error?: { code?: string; message?: string };
				summary?: string;
				data?: unknown;
			};
			const code =
				record.outcome === 'needs_clarification' || record.error?.code === 'not_found'
					? 3
					: ['conflict', 'version_mismatch'].includes(record.error?.code ?? '')
						? 4
						: record.ok === false
							? 1
							: 0;
			if (code) stderr.write(`${record.error?.message ?? record.summary ?? 'Tool failed'}\n`);
			if (!quiet)
				stdout.write(
					json || !(stdout as { isTTY?: boolean }).isTTY
						? `${JSON.stringify(result, null, compact ? undefined : 2)}\n`
						: `${record.summary ?? ''}\n${JSON.stringify(record.data ?? {}, null, 2)}\n`,
				);
			return code;
		} finally {
			await options.closeContext?.(context);
		}
	} catch (error) {
		return fail(
			error instanceof Error ? error.message : String(error),
			error instanceof CliUsageError ? 2 : 70,
		);
	}
}
