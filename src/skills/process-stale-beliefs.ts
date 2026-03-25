import { defineCodexSkill } from './skill_types.ts';

export const processStaleBeliefsSkill = defineCodexSkill({
	name: 'process-stale-beliefs',
	description: 'Refresh beliefs whose freshness has dropped too far.',
	content: `## Goal
Refresh or retire stale beliefs before they silently rot.

## Steps
1. Review stale flags.
2. Confirm still-valid beliefs.
3. Correct or forget outdated beliefs.`,
});
