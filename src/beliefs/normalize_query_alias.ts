import { CodexValidationError } from '../errors.ts';
import { normalizeClaim } from './normalize_claim.ts';

export function normalizeQueryAlias(term: string, alias: string): [string, string] {
	const words = [normalizeClaim(term), normalizeClaim(alias)];
	if (words.some((word) => !word || word.includes(' ')) || words[0] === words[1])
		throw new CodexValidationError('Query aliases require two distinct, non-empty single words.');
	return words as [string, string];
}
