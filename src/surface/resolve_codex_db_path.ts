import { homedir } from 'node:os';
import { join } from 'node:path';

export function resolveCodexDbPath(
	options: { flag?: string; env?: Record<string, string | undefined> } = {},
): string {
	return (
		options.flag ??
		((options.env ?? process.env).GHOSTPAW_CODEX_DB || join(homedir(), '.ghostpaw', 'codex.db'))
	);
}
