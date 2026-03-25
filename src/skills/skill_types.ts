export interface CodexSkill {
	name: string;
	description: string;
	content: string;
}

export type CodexSkillRegistry = readonly CodexSkill[];

export function defineCodexSkill<TSkill extends CodexSkill>(skill: TSkill): TSkill {
	return skill;
}
