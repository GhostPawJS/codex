import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseReviewDate } from './parse_review_date.ts';

test('review dates accept signed and unsigned relative days and existing formats', (t) => {
	const now = new Date(2026, 5, 15, 12).getTime();
	t.mock.timers.enable({ apis: ['Date'], now });
	for (const [raw, days] of [
		['-3d', -3],
		['30d', 30],
		['+3d', 3],
		['0d', 0],
		['today', 0],
		['tomorrow', 1],
	] as const) {
		const expected = new Date(now);
		expected.setDate(expected.getDate() + days);
		expected.setHours(23, 59, 59, 999);
		assert.equal(parseReviewDate(raw), expected.getTime());
	}
	assert.equal(parseReviewDate('2000-01-01'), new Date(2000, 0, 1, 23, 59, 59, 999).getTime());
	assert.equal(parseReviewDate('01.01.2000'), parseReviewDate('2000-01-01'));
	assert.equal(parseReviewDate('2000-01-01T12:00:00Z'), Date.parse('2000-01-01T12:00:00Z'));
	assert.equal(parseReviewDate('1234'), 1234);
	for (const raw of ['bad-date', '-3x', '1.5d', '999999999999999999d']) {
		assert.throws(
			() => parseReviewDate(raw),
			(error: Error) => error.message.includes('--now') && error.message.includes(raw),
		);
	}
});
