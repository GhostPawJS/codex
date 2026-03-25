export interface VersionDiff {
	before: string;
	after: string;
}

export function computeVersionDiff(before: string, after: string): VersionDiff {
	return { before, after };
}
