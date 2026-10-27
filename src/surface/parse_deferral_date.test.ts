import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseDeferralDate } from './parse_deferral_date.ts';

test('deferral dates accept local date grammar, ISO and epoch milliseconds', () => {
	const now = new Date(2030, 0, 10, 12).getTime();
	const end = (day: number) => new Date(2030, 0, day, 23, 59, 59, 999).getTime();
	for (const [raw, expected] of [
		['2030-01-12', end(12)],
		['12.01.2030', end(12)],
		['today', end(10)],
		['tomorrow', end(11)],
		['+3d', end(13)],
		['2030-01-12T13:00:00Z', Date.parse('2030-01-12T13:00:00Z')],
		[String(end(12)), end(12)],
	] as const)
		assert.equal(parseDeferralDate(raw, now), expected, raw);
	for (const raw of ['2020-01-01', String(now), '-1'])
		assert.throws(() => parseDeferralDate(raw, now), /--deferred-until must be in the future/);
	for (const raw of [
		'',
		'2030-02-30',
		'30.02.2030',
		'next week',
		'2030-02-30T12:00:00Z',
		'99999999999999999999',
	])
		assert.throws(() => parseDeferralDate(raw, now), /Invalid --deferred-until/);
});
