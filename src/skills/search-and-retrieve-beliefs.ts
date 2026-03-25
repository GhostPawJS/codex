import { defineCodexSkill } from './skill_types.ts';

export const searchAndRetrieveBeliefsSkill = defineCodexSkill({
	name: 'search-and-retrieve-beliefs',
	description: 'Use recall first, then inspect exact beliefs in detail.',
	content: `## Goal
Retrieve current beliefs without scanning the whole codex.

## Steps
1. Use \`search_codex\`.
2. Inspect the strongest candidates.
3. Use lineage and proximity only when needed.`,
});
