import { defineCodexSkill } from './skill_types.ts';

export const handleAmbiguousBeliefUpdatesSkill = defineCodexSkill({
	name: 'handle-ambiguous-belief-updates',
	description: 'Decide between confirm, correct, merge, forget, and dismiss on uncertain updates.',
	content: `## Goal
Choose the least distorted mutation when a new claim collides with an old one.

## Steps
1. Inspect the current belief.
2. If unchanged, confirm.
3. If replaced, correct.
4. If overlapping, merge.
5. If unrelated, remember or dismiss proximity.`,
});
