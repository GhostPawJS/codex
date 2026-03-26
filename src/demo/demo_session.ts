import type { CodexDb } from '../database.ts';
import {
	confirmBelief,
	correctBelief,
	deferBelief,
	dismissProximityPair,
	forgetBelief,
	remember,
} from '../write.ts';

const DAY = 86_400_000;

export function seedDemoSession(db: CodexDb): void {
	const count = Number(db.prepare('SELECT COUNT(*) AS count FROM beliefs').get()?.count ?? 0);
	if (count > 0) return;

	const now = Date.now();
	const skip = { skipProximity: true };

	// ── Strong, well-confirmed beliefs ──────────────────────────────

	const b1 = remember(
		db,
		{
			claim: 'TypeScript improves maintainability over plain JavaScript.',
			source: 'explicit',
			category: 'fact',
			provenance: 'engineering retrospective',
		},
		{ now: now - 180 * DAY, ...skip },
	);
	confirmBelief(db, b1.id, { now: now - 120 * DAY });
	confirmBelief(db, b1.id, { now: now - 60 * DAY });
	confirmBelief(db, b1.id, { now: now - 30 * DAY });
	confirmBelief(db, b1.id, { now: now - 7 * DAY });

	const b2 = remember(
		db,
		{
			claim: 'I prefer dark mode for all development environments.',
			source: 'explicit',
			category: 'preference',
			provenance: 'personal settings audit',
		},
		{ now: now - 150 * DAY, ...skip },
	);
	confirmBelief(db, b2.id, { now: now - 90 * DAY });
	confirmBelief(db, b2.id, { now: now - 14 * DAY });

	const b3 = remember(
		db,
		{
			claim: 'Container-based deployments are more reliable than bare metal.',
			source: 'observed',
			category: 'fact',
			provenance: 'incident post-mortem',
		},
		{ now: now - 120 * DAY, ...skip },
	);
	confirmBelief(db, b3.id, { now: now - 75 * DAY });
	confirmBelief(db, b3.id, { now: now - 40 * DAY });
	confirmBelief(db, b3.id, { now: now - 10 * DAY });

	// ── Corrected beliefs with lineage ──────────────────────────────

	const b4 = remember(
		db,
		{
			claim: 'The primary API uses REST endpoints.',
			source: 'explicit',
			category: 'fact',
			provenance: 'architecture doc v1',
		},
		{ now: now - 150 * DAY, ...skip },
	);
	const b5 = correctBelief(
		db,
		b4.id,
		{
			claim: 'The primary API uses GraphQL with a REST fallback.',
			provenance: 'architecture doc v2',
		},
		{ now: now - 90 * DAY, ...skip },
	);
	confirmBelief(db, b5.id, { now: now - 30 * DAY });

	const b6 = remember(
		db,
		{
			claim: 'The default database is MySQL.',
			source: 'observed',
			category: 'fact',
			provenance: 'legacy config review',
		},
		{ now: now - 120 * DAY, ...skip },
	);
	const b7 = correctBelief(
		db,
		b6.id,
		{
			claim: 'The default database is PostgreSQL 16.',
			source: 'explicit',
			provenance: 'migration RFC',
		},
		{ now: now - 60 * DAY, ...skip },
	);
	confirmBelief(db, b7.id, { now: now - 15 * DAY });

	// ── Low-trust inferred beliefs (naturally flagged) ──────────────

	remember(
		db,
		{
			claim: 'Users prefer weekly email digests over daily notifications.',
			source: 'inferred',
			category: 'preference',
			provenance: 'analytics pattern',
		},
		{ now: now - 60 * DAY, ...skip },
	);

	remember(
		db,
		{
			claim: 'The staging environment mirrors production exactly.',
			source: 'inferred',
			category: 'fact',
			provenance: 'assumed from deploy scripts',
		},
		{ now: now - 30 * DAY, ...skip },
	);

	// ── Old unconfirmed beliefs (stale/fading flags) ────────────────

	remember(
		db,
		{
			claim: 'Team standup is at 9:30 AM daily.',
			source: 'explicit',
			category: 'procedure',
			provenance: 'team onboarding doc',
		},
		{ now: now - 180 * DAY, ...skip },
	);

	remember(
		db,
		{
			claim: 'Maximum upload file size is 10 MB.',
			source: 'observed',
			category: 'capability',
			provenance: 'server config',
		},
		{ now: now - 150 * DAY, ...skip },
	);

	// ── Deferred belief ─────────────────────────────────────────────

	const b12 = remember(
		db,
		{
			claim: 'Migrate authentication to OAuth 2.1 by Q3.',
			source: 'explicit',
			category: 'procedure',
			provenance: 'security roadmap',
		},
		{ now: now - 30 * DAY, ...skip },
	);
	deferBelief(db, b12.id, now + 60 * DAY, { now: now - 28 * DAY });

	// ── Proximity pairs ─────────────────────────────────────────────

	const b13 = remember(
		db,
		{
			claim: 'React is the preferred frontend framework.',
			source: 'explicit',
			category: 'preference',
		},
		{ now: now - 90 * DAY, ...skip },
	);
	confirmBelief(db, b13.id, { now: now - 45 * DAY });

	const b14 = remember(
		db,
		{
			claim: 'React.js is our chosen UI framework.',
			source: 'observed',
			category: 'preference',
		},
		{ now: now - 60 * DAY, ...skip },
	);

	dismissProximityPair(db, b13.id, b14.id, { now: now - 40 * DAY });

	const b15 = remember(
		db,
		{
			claim: 'Code reviews require at least two approvals.',
			source: 'explicit',
			category: 'procedure',
			provenance: 'CONTRIBUTING.md',
		},
		{ now: now - 120 * DAY, ...skip },
	);
	confirmBelief(db, b15.id, { now: now - 50 * DAY });

	remember(
		db,
		{
			claim: 'Pull requests need minimum two reviewer approvals.',
			source: 'distilled',
			category: 'procedure',
			provenance: 'team conversation summary',
		},
		{ now: now - 90 * DAY, ...skip },
	);

	// ── Forgotten belief with successor ─────────────────────────────

	const b17 = remember(
		db,
		{
			claim: 'Use Webpack for all frontend builds.',
			source: 'explicit',
			category: 'procedure',
			provenance: 'build tooling decision',
		},
		{ now: now - 150 * DAY, ...skip },
	);
	const b18 = remember(
		db,
		{
			claim: 'Use Vite for all frontend builds.',
			source: 'explicit',
			category: 'procedure',
			provenance: 'build tooling migration',
		},
		{ now: now - 60 * DAY, ...skip },
	);
	forgetBelief(db, b17.id, { now: now - 58 * DAY, successorId: b18.id });

	// ── Additional variety ──────────────────────────────────────────

	remember(
		db,
		{
			claim: 'Python is supported for backend services.',
			source: 'distilled',
			category: 'capability',
			provenance: 'platform capability matrix',
		},
		{ now: now - 90 * DAY, ...skip },
	);

	const b20 = remember(
		db,
		{
			claim: 'Always run integration tests before deploying.',
			source: 'explicit',
			category: 'procedure',
			provenance: 'deployment checklist',
		},
		{ now: now - 120 * DAY, ...skip },
	);
	confirmBelief(db, b20.id, { now: now - 60 * DAY });
	confirmBelief(db, b20.id, { now: now - 5 * DAY });

	remember(
		db,
		{
			claim: 'The CDN caches static assets for 24 hours.',
			source: 'observed',
			category: 'fact',
			provenance: 'cache header inspection',
		},
		{ now: now - 60 * DAY, ...skip },
	);

	const b22 = remember(
		db,
		{
			claim: 'I dislike verbose XML configuration files.',
			source: 'explicit',
			category: 'preference',
		},
		{ now: now - 90 * DAY, ...skip },
	);
	confirmBelief(db, b22.id, { now: now - 20 * DAY });

	remember(
		db,
		{
			claim: 'Custom error codes follow the XXXX-YYY format.',
			source: 'explicit',
			category: 'custom',
			provenance: 'error handling RFC',
		},
		{ now: now - 60 * DAY, ...skip },
	);

	remember(
		db,
		{
			claim: 'GraphQL subscriptions handle real-time data updates.',
			source: 'distilled',
			category: 'capability',
			provenance: 'API design review',
		},
		{ now: now - 30 * DAY, ...skip },
	);

	const b25 = remember(
		db,
		{
			claim: 'The CI pipeline completes in under 8 minutes.',
			source: 'observed',
			category: 'fact',
			provenance: 'pipeline metrics dashboard',
		},
		{ now: now - 21 * DAY, ...skip },
	);
	confirmBelief(db, b25.id, { now: now - 7 * DAY });
}
