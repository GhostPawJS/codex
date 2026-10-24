import { existsSync, readFileSync, writeFileSync } from 'node:fs';

export const budgets = existsSync('budgets.json')
	? JSON.parse(readFileSync('budgets.json', 'utf8'))
	: {};
export const updating = process.argv.includes('--update');
export function update(section, values, higherIsTighter = false) {
	const loosened = [];
	function compare(old, next, path) {
		for (const [key, value] of Object.entries(old ?? {})) {
			const label = `${path}.${key}`;
			if (!(key in next)) loosened.push(`${label} removed`);
			else if (value && typeof value === 'object') {
				if (!next[key] || typeof next[key] !== 'object')
					loosened.push(`${label}: invalid replacement`);
				else compare(value, next[key], label);
			} else if (
				typeof next[key] !== 'number' ||
				!Number.isFinite(next[key]) ||
				(higherIsTighter ? next[key] < value : next[key] > value)
			)
				loosened.push(`${label}: ${value} → ${next[key]}`);
		}
	}
	compare(budgets[section], values, section);
	if (loosened.length && process.env.BUDGET_INCREASE_APPROVED !== '1')
		throw new Error(
			`Refusing looser budgets without BUDGET_INCREASE_APPROVED=1:\n${loosened.join('\n')}`,
		);
	budgets[section] = values;
	writeFileSync('budgets.json', `${JSON.stringify(budgets, null, '\t')}\n`);
}
export function gate(rows) {
	console.table(rows);
	if (rows.some((row) => row.status === 'FAIL')) process.exitCode = 1;
}
