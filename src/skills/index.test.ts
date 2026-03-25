import { ok, strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
	batchIngestWithDeduplicationSkill,
	captureBeliefsWellSkill,
	codexSkills,
	correctBeliefLineageHonestlySkill,
	deferBeliefsPendingOutcomesSkill,
	defineCodexSkill,
	diagnoseDecliningIntegritySkill,
	directSupersessionBetweenBeliefsSkill,
	dismissFalseProximityPairsSkill,
	eraseBeliefsForPrivacySkill,
	getCodexSkillByName,
	handleAmbiguousBeliefUpdatesSkill,
	listCodexSkills,
	monitorPortfolioHealthSkill,
	preRegisterBeliefsBeforeDecisionsSkill,
	processStaleBeliefsSkill,
	resolveNearDuplicateBeliefsSkill,
	reviewFlagsBatchSkill,
	runCalibrationPassSkill,
	searchAndRetrieveBeliefsSkill,
	upgradeSourceEvidenceSkill,
} from './index.ts';

describe('skills barrel export', () => {
	it('exports all 17 skill definitions', () => {
		const skills = [
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
		];
		for (const skill of skills) {
			ok(skill.name.length > 0);
			ok(skill.description.length > 0);
			ok(skill.content.length > 0);
		}
		strictEqual(skills.length, 17);
	});

	it('exports registry functions', () => {
		strictEqual(typeof listCodexSkills, 'function');
		strictEqual(typeof getCodexSkillByName, 'function');
		ok(Array.isArray(codexSkills));
	});

	it('exports defineCodexSkill', () => {
		strictEqual(typeof defineCodexSkill, 'function');
	});

	it('registry is reachable from barrel', () => {
		strictEqual(listCodexSkills().length, 17);
		ok(getCodexSkillByName('search-and-retrieve-beliefs') !== null);
	});
});
