import { captureBeliefsWellSkill } from './capture-beliefs-well.ts';
import { correctBeliefLineageHonestlySkill } from './correct-belief-lineage-honestly.ts';
import { handleAmbiguousBeliefUpdatesSkill } from './handle-ambiguous-belief-updates.ts';
import { processStaleBeliefsSkill } from './process-stale-beliefs.ts';
import { resolveNearDuplicateBeliefsSkill } from './resolve-near-duplicate-beliefs.ts';
import { reviewFlagsBatchSkill } from './review-flags-batch.ts';
import { runCalibrationPassSkill } from './run-calibration-pass.ts';
import { searchAndRetrieveBeliefsSkill } from './search-and-retrieve-beliefs.ts';
import type { CodexSkillRegistry } from './skill_types.ts';

export const codexSkills = [
	captureBeliefsWellSkill,
	reviewFlagsBatchSkill,
	resolveNearDuplicateBeliefsSkill,
	correctBeliefLineageHonestlySkill,
	processStaleBeliefsSkill,
	runCalibrationPassSkill,
	searchAndRetrieveBeliefsSkill,
	handleAmbiguousBeliefUpdatesSkill,
] satisfies CodexSkillRegistry;

export function listCodexSkills() {
	return [...codexSkills];
}
export function getCodexSkillByName(name: string) {
	return codexSkills.find((skill) => skill.name === name) ?? null;
}
