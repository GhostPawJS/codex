export function summarizeCount(count: number, singular: string, plural?: string): string {
	const noun = count === 1 ? singular : (plural ?? `${singular}s`);
	return `${count} ${noun}`;
}
