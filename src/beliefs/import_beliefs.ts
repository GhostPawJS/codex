import type { CodexDb } from '../database.ts';
import { CodexValidationError } from '../errors.ts';
import { withTransaction } from '../with_transaction.ts';
import { remember } from './remember.ts';
import type { RememberBeliefInput } from './types.ts';

export interface ImportBeliefsResult {
	committed: boolean;
	dryRun: boolean;
	items: { index: number; id?: number; duplicate?: boolean; error?: string }[];
}

/** One transaction per batch. Dry-run ids are provisional and are never persisted. */
export function importBeliefs(
	db: CodexDb,
	inputs: readonly RememberBeliefInput[],
	options: { dryRun?: boolean } = {},
): ImportBeliefsResult {
	if (!Array.isArray(inputs)) throw new CodexValidationError('Belief import requires an array.');
	const result: ImportBeliefsResult = {
		committed: false,
		dryRun: options.dryRun === true,
		items: [],
	};
	const rollback = new Error('rollback import');
	try {
		withTransaction(db, () => {
			for (const [index, input] of inputs.entries()) {
				try {
					if (!input || typeof input !== 'object' || typeof input.claim !== 'string')
						throw new CodexValidationError(
							'Each item must be a belief object with claim, source and category.',
						);
					if (input.allowDuplicate !== undefined && typeof input.allowDuplicate !== 'boolean')
						throw new CodexValidationError('allowDuplicate must be a boolean.');
					if (input.provenance != null && typeof input.provenance !== 'string')
						throw new CodexValidationError('provenance must be a string.');
					const belief = remember(db, input, { skipProximity: true });
					result.items.push({
						index,
						id: belief.id,
						...(belief.duplicate ? { duplicate: true } : {}),
					});
				} catch (error) {
					result.items.push({
						index,
						error: error instanceof Error ? error.message : String(error),
					});
				}
			}
			if (result.dryRun || result.items.some((item) => item.error)) throw rollback;
		});
		result.committed = true;
	} catch (error) {
		if (error !== rollback) throw error;
		if (result.items.some((item) => item.error))
			result.items = result.items.map((item) => ({
				index: item.index,
				error: item.error ?? 'Batch rolled back because another item failed.',
			}));
	}
	return result;
}

/** Parse a JSON array or JSON Lines; malformed lines report their 1-based line number. */
export function parseBeliefImport(text: string): RememberBeliefInput[] {
	const trimmed = text.trim();
	if (!trimmed) return [];
	if (trimmed.startsWith('[')) {
		let parsed: unknown;
		try {
			parsed = JSON.parse(trimmed);
		} catch {
			throw new CodexValidationError('Invalid JSON array.');
		}
		if (!Array.isArray(parsed)) throw new CodexValidationError('Expected a JSON array.');
		return parsed;
	}
	return text.split(/\r?\n/).flatMap((line, index) => {
		if (!line.trim()) return [];
		try {
			return [JSON.parse(line)];
		} catch {
			throw new CodexValidationError(`Invalid JSON on line ${index + 1}.`);
		}
	});
}
