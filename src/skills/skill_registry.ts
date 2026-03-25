import { batchIngestWithDeduplicationSkill } from './batch-ingest-with-deduplication.ts';
import { captureBeliefsWellSkill } from './capture-beliefs-well.ts';
import { correctBeliefLineageHonestlySkill } from './correct-belief-lineage-honestly.ts';
import { deferBeliefsPendingOutcomesSkill } from './defer-beliefs-pending-outcomes.ts';
import { diagnoseDecliningIntegritySkill } from './diagnose-declining-integrity.ts';
import { directSupersessionBetweenBeliefsSkill } from './direct-supersession-between-beliefs.ts';
import { dismissFalseProximityPairsSkill } from './dismiss-false-proximity-pairs.ts';
import { eraseBeliefsForPrivacySkill } from './erase-beliefs-for-privacy.ts';
import { handleAmbiguousBeliefUpdatesSkill } from './handle-ambiguous-belief-updates.ts';
import { monitorPortfolioHealthSkill } from './monitor-portfolio-health.ts';
import { preRegisterBeliefsBeforeDecisionsSkill } from './pre-register-beliefs-before-decisions.ts';
import { processStaleBeliefsSkill } from './process-stale-beliefs.ts';
import { resolveNearDuplicateBeliefsSkill } from './resolve-near-duplicate-beliefs.ts';
import { reviewFlagsBatchSkill } from './review-flags-batch.ts';
import { runCalibrationPassSkill } from './run-calibration-pass.ts';
import { searchAndRetrieveBeliefsSkill } from './search-and-retrieve-beliefs.ts';
import type { CodexSkillRegistry } from './skill_types.ts';
import { upgradeSourceEvidenceSkill } from './upgrade-source-evidence.ts';

export const codexSkills = [
	searchAndRetrieveBeliefsSkill,
	captureBeliefsWellSkill,
	reviewFlagsBatchSkill,
	resolveNearDuplicateBeliefsSkill,
	correctBeliefLineageHonestlySkill,
	handleAmbiguousBeliefUpdatesSkill,
	processStaleBeliefsSkill,
	runCalibrationPassSkill,
	deferBeliefsPendingOutcomesSkill,
	eraseBeliefsForPrivacySkill,
	batchIngestWithDeduplicationSkill,
	diagnoseDecliningIntegritySkill,
	upgradeSourceEvidenceSkill,
	preRegisterBeliefsBeforeDecisionsSkill,
	directSupersessionBetweenBeliefsSkill,
	dismissFalseProximityPairsSkill,
	monitorPortfolioHealthSkill,
] satisfies CodexSkillRegistry;

export function listCodexSkills() {
	return [...codexSkills];
}
export function getCodexSkillByName(name: string) {
	return codexSkills.find((skill) => skill.name === name) ?? null;
}
