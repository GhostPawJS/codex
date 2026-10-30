import { CliUsageError } from '../surfaces/cli_args.ts';
import { parseDeferralDate } from './parse_deferral_date.ts';

export function parseReviewDate(raw: string): number {
	try {
		return parseDeferralDate(raw, Number.MIN_SAFE_INTEGER, Date.now());
	} catch (error) {
		throw new CliUsageError((error as Error).message.replaceAll('--deferred-until', '--now'));
	}
}
