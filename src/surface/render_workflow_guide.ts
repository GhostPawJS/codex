const commands: Record<string, string> = {
	search_codex: 'search',
	remember_belief: 'belief add',
	inspect_codex_item: 'belief show',
	revise_belief: 'belief confirm|correct|merge|forget|defer',
	retire_belief: 'belief retire',
	dismiss_proximity: 'proximity dismiss',
	review_codex: 'review',
};

export function renderWorkflowGuide(guide: { content: string }): string {
	return guide.content.replace(/`([a-z_]+)`/g, (name, tool: string) =>
		commands[tool] ? `${name} (CLI: \`ghostpaw-codex ${commands[tool]}\`)` : name,
	);
}
