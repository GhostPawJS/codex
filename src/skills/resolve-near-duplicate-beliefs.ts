import { defineCodexSkill } from './skill_types.ts';

export const resolveNearDuplicateBeliefsSkill = defineCodexSkill({
	name: 'resolve-near-duplicate-beliefs',
	description: 'Resolve misleading proximity hits through correction, merge, or dismissal.',
	content: `## Goal
Decide whether two nearby beliefs are the same, successors, or unrelated.

## Steps
1. Inspect both beliefs.
2. If one replaces the other, correct or forget with successor.
3. If both should remain, dismiss the pair.`,
});
