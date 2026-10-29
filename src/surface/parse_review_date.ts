import { CliUsageError } from '../surfaces/cli_args.ts';
import { parseDeferralDate } from './parse_deferral_date.ts';

export function parseReviewDate(raw: string): number {
	try {
		if (/^\+\d+d$/.test(raw) || raw === 'today' || raw === 'tomorrow')
			return parseDeferralDate(raw);
		return parseDeferralDate(raw, Number.MIN_SAFE_INTEGER);
	} catch (error) {
		throw new CliUsageError((error as Error).message.replaceAll('--deferred-until', '--now'));
	}
}
