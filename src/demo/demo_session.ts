import type { CodexDb } from '../database.ts';
import { remember } from '../write.ts';

export function seedDemoSession(db: CodexDb): void {
	const count = Number(db.prepare('SELECT COUNT(*) AS count FROM beliefs').get()?.count ?? 0);
	if (count > 0) {
		return;
	}
	const skip = { skipProximity: true };
	remember(
		db,
		{ claim: 'The API uses GraphQL.', source: 'explicit', category: 'fact', provenance: 'demo' },
		{ now: 1, ...skip },
	);
	remember(
		db,
		{
			claim: 'I prefer dark mode.',
			source: 'explicit',
			category: 'preference',
			provenance: 'demo',
		},
		{ now: 2, ...skip },
	);
	remember(
		db,
		{
			claim: 'Deploying on Friday is risky.',
			source: 'inferred',
			category: 'fact',
			provenance: 'demo',
		},
		{ now: 3, ...skip },
	);
}
