import { isSea } from 'node:sea';

let npmEntry = false;
export function markNpmEntry(): void {
	npmEntry = true;
}
export function cliVersion(
	version: string,
	{
		bin = 'ghostpaw-codex',
		sea = isSea,
		npm = npmEntry,
		platform = process.platform,
		arch = process.arch,
	}: {
		bin?: string;
		sea?: () => boolean;
		npm?: boolean;
		platform?: string;
		arch?: string;
	} = {},
): string {
	let binary = false;
	try {
		binary = sea();
	} catch {
		binary = false;
	}
	const variant = binary
		? `binary, ${platform === 'win32' ? 'windows' : platform}-${arch}`
		: npm
			? 'npm'
			: 'library';
	return `${bin} ${version} (${variant})`;
}
