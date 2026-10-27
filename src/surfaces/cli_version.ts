import { isSea } from 'node:sea';

let npmEntry = false;
export function markNpmEntry(): void {
	npmEntry = true;
}
type VersionOptions = {
	bin?: string;
	sea?: () => boolean;
	npm?: boolean;
	platform?: string;
	arch?: string;
};

export function cliVersionInfo(
	version: string,
	{
		bin = 'ghostpaw-codex',
		sea = isSea,
		npm = npmEntry,
		platform = process.platform,
		arch = process.arch,
	}: VersionOptions = {},
): { name: string; version: string; variant: 'binary' | 'npm' | 'library'; target: string | null } {
	let binary = false;
	try {
		binary = sea();
	} catch {
		binary = false;
	}
	return {
		name: bin,
		version,
		variant: binary ? 'binary' : npm ? 'npm' : 'library',
		target: binary ? `${platform === 'win32' ? 'windows' : platform}-${arch}` : null,
	};
}

export function cliVersion(
	version: string,
	options: VersionOptions & { args?: readonly string[] } = {},
): string {
	const info = cliVersionInfo(version, options);
	if (options.args?.includes('--json')) return JSON.stringify(info);
	if (options.args?.includes('--short')) return version;
	return `${info.name} ${version} (${info.target ? `binary, ${info.target}` : info.variant})`;
}
