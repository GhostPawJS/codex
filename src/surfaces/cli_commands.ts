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
				flags: action?.flags?.[String(value)],
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
	let json = argv.includes('--json') || argv.includes('-j'),
		quiet = argv.includes('--quiet') || argv.includes('-q'),
		compact = false,
		help = false;
	let db: string | undefined;
	const fail = (message: string, code: number) => {
		stderr.write(`${message}\n`);
		if (json && !quiet)
			stdout.write(
				`${JSON.stringify({ ok: false, error: { code: code === 2 ? 'usage_error' : code === 3 ? 'not_found' : 'internal_error', message } })}\n`,
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
				if (!db || /^--[a-z]/i.test(db)) throw new CliUsageError('--db requires a path');
			} else if (flag === '--json' || flag === '-j') json = true;
			else if (flag === '--quiet' || flag === '-q') quiet = true;
			else if (flag === '--compact') compact = true;
			else if (flag === '--help' || flag === '-h') help = true;
			else if (['--version', '-V', '-v'].includes(flag ?? '')) {
				if (!quiet)
					stdout.write(`${cliVersion(options.version, { bin: options.bin, args: argv })}\n`);
				return 0;
			} else if (flag !== '--no-color') continue;
			args.splice(i--, 1);
		}
		if (args[0] === 'version') {
			if (!quiet)
				stdout.write(`${cliVersion(options.version, { bin: options.bin, args: argv })}\n`);
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
				...(name === 'claim' ? { short: 'c' } : {}),
				type:
					schema.type === 'object' || !schema.type ? 'json' : (schema.type as CliArgument['type']),
				description: schema.description,
				enum: schema.enum,
				parseValue:
					command.tool.cli?.valueParsers?.[
						name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())
					],
				...(command.tool.cli?.fileArgs?.includes(
					name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase()),
				)
					? { file: true }
					: {}),
				...(schema.items?.type ? { itemType: schema.items.type as CliArgument['type'] } : {}),
			});
			const properties = command.tool.inputSchema.properties ?? {};
			return {
				command: `${options.bin} ${command.path}`,
				description: command.fixed.action
					? `${String(command.fixed.action)[0]?.toUpperCase()}${String(command.fixed.action).slice(1)} a belief.`
					: command.tool.description,
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
					.filter(
						([name]) =>
							!(name in command.fixed) && (!command.flags || command.flags.includes(name)),
					)
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
		if (args[0] === 'alias' && options.commands?.alias) {
			if (help) {
				if (!quiet)
					stdout.write(`${options.bin} alias add <term> <alias> | remove <term> <alias> | list\n`);
				return 0;
			}
			const action = args[1];
			if (
				!(
					(action === 'list' && args.length === 2) ||
					(['add', 'remove'].includes(action ?? '') && args.length === 4)
				)
			)
				throw new CliUsageError('Usage: alias add <term> <alias> | remove <term> <alias> | list');
			const context = await options.openContext(db === undefined ? {} : { db });
			try {
				const result = options.commands.alias(context, args.slice(1));
				if (result.code) stderr.write(`${result.text}\n`);
				if (quiet && action === 'list')
					stdout.write(
						`${result.text === 'No aliases.' ? '' : result.text.replace(/ {2}/g, ' ')}${result.text === 'No aliases.' ? '' : '\n'}`,
					);
				if (!quiet)
					stdout.write(
						json ? `${JSON.stringify(result.data)}\n` : result.code ? '' : `${result.text}\n`,
					);
				return result.code ?? 0;
			} finally {
				await options.closeContext?.(context);
			}
		}
		if (help) {
			const matches = tree.filter((command) => command.path.startsWith(args.join(' ')));
			if (!matches.length) throw new CliUsageError(`Unknown command: ${args.join(' ')}`);
			if (!quiet)
				stdout.write(
					entry
						? `${renderCliHelp(specFor(entry))}Global flags: --json/-j, --quiet/-q, --help/-h, --db <path>\n`
						: `${options.bin} ${options.version}\n${options.description}\n${options.describeDb ? `\n${options.describeDb(db === undefined ? {} : { db })}\n` : ''}\nCommands:\n${matches.map((command) => `  ${command.path}`).join('\n')}\n  alias add|remove|list\n  mcp, skill, tools [--json], describe <tool>, call <tool> [JSON|-], completions <bash|zsh|fish>, version\nGlobal flags: --db <path>, --json/-j, --quiet/-q, --compact, --claim/-c, --help/-h, --version/-V/-v, --no-color\n`,
				);
			return 0;
		}
		if (args[0] === 'completions') {
			const shell = args[1];
			if (!['bash', 'zsh', 'fish'].includes(shell ?? ''))
				throw new CliUsageError('Expected completion shell: bash, zsh or fish');
			if (quiet) return 0;
			const words = [...new Set(tree.flatMap((command) => command.path.split(' ')))].concat([
				'alias',
				'add',
				'remove',
				'list',
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
			if (!ended && token.startsWith('-') && token !== '-') {
				const flag = spec.flags?.find(
					(arg) => `--${arg.name}` === token || `-${arg.short}` === token,
				);
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
		if (errors.length) {
			const missing = errors
				.map((error) => /^\$\.([^:]+): required$/.exec(error)?.[1])
				.filter(Boolean);
			throw new CliUsageError(
				`${missing.length ? `Missing required argument: ${missing.join(', ')}.` : errors.join('\n')} Usage: ${spec.command} ${entry.positionals.map((name) => `<${name}>`).join(' ')} [flags]. See ${spec.command} --help.`,
			);
		}
		const context = await options.openContext(db === undefined ? {} : { db });
		try {
			const result = await entry.tool.handler(context, input);
			const record = result as {
				ok?: boolean;
				outcome?: string;
				error?: { code?: string; message?: string; recovery?: string };
				clarification?: { question: string; missing: string[] };
				summary?: string;
				data?: unknown;
			};
			const code =
				record.error?.code === 'invalid_input' || record.outcome === 'needs_clarification'
					? 2
					: record.error?.code === 'not_found'
						? 3
						: ['conflict', 'version_mismatch'].includes(record.error?.code ?? '')
							? 4
							: record.ok === false
								? 1
								: 0;
			if (code) {
				const missing = record.clarification?.missing.map(
					(name) => `--${name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`,
				);
				stderr.write(
					`${record.clarification?.question ?? record.error?.message ?? record.summary ?? 'Tool failed'}\n${missing?.length ? `Missing: ${missing.join(', ')}\n` : ''}${record.error?.recovery ? `${record.error.recovery}\n` : ''}`,
				);
			}
			if (json && !quiet)
				stdout.write(`${JSON.stringify(result, null, compact ? undefined : 2)}\n`);
			else if (!code && options.formatResult) {
				stdout.write(options.formatResult(result, entry.tool, input, quiet));
				const warnings = (result as { warnings?: { code?: string; message?: string }[] }).warnings;
				if (!quiet)
					for (const warning of warnings ?? [])
						if (warning.code !== 'empty_result' && warning.code !== 'no_match')
							stderr.write(`warning: ${warning.message}\n`);
			} else if (!quiet && !code)
				stdout.write(`${JSON.stringify(result, null, compact ? undefined : 2)}\n`);
			return code;
		} finally {
			await options.closeContext?.(context);
		}
	} catch (error) {
		return fail(
			error instanceof Error ? error.message : String(error),
			error instanceof CliUsageError || (error as { code?: string }).code === 'validation'
				? 2
				: (error as { code?: string }).code === 'not_found'
					? 3
					: 70,
		);
	}
}
