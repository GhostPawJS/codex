import { CliUsageError } from '../surfaces/cli_args.ts';

export function parseDeferralDate(raw: string, now = Date.now(), relativeNow = now): number {
	const invalid = () =>
		new CliUsageError(
			`Invalid --deferred-until "${raw}". Use YYYY-MM-DD, DD.MM.YYYY, today, tomorrow, +3d, ISO date-time or epoch ms.`,
		);
	let date: Date;
	if (/^-?\d+$/.test(raw)) {
		if (!Number.isSafeInteger(Number(raw))) throw invalid();
		date = new Date(Number(raw));
	} else {
		const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
		const european = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(raw);
		if (iso || european) {
			const year = Number(iso?.[1] ?? european?.[3]);
			const month = Number(iso?.[2] ?? european?.[2]);
			const day = Number(iso?.[3] ?? european?.[1]);
			date = new Date(0);
			date.setFullYear(year, month - 1, day);
			date.setHours(23, 59, 59, 999);
			if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day)
				throw invalid();
		} else if (raw === 'today' || raw === 'tomorrow' || /^[+-]?\d+d$/.test(raw)) {
			date = new Date(relativeNow);
			date.setDate(
				date.getDate() + (raw === 'today' ? 0 : raw === 'tomorrow' ? 1 : Number(raw.slice(0, -1))),
			);
			date.setHours(23, 59, 59, 999);
		} else {
			if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/.test(raw))
				throw invalid();
			parseDeferralDate(raw.slice(0, 10), Number.MIN_SAFE_INTEGER);
			date = new Date(raw);
		}
	}
	if (!Number.isFinite(date.getTime())) throw invalid();
	if (date.getTime() <= now) throw new CliUsageError('--deferred-until must be in the future.');
	return date.getTime();
}
