import { codexCliOptions } from './surface/codex_cli_options.ts';
import { runToolCli } from './surfaces/cli.ts';
import { markNpmEntry } from './surfaces/cli_version.ts';

markNpmEntry();
process.exitCode = await runToolCli(process.argv.slice(2), codexCliOptions);
