import { normalizeClaim } from './normalize_claim.ts';

// Query-side related terms for everyday questions whose answer rarely repeats the
// question's words ("what class does fox play" -> "Fox mains a Warrior"). Directed:
// only query words expand, so stored claims are never rewritten.
const RELATED: Record<string, string> = {
	play: 'main plays playing',
	plays: 'main play playing',
	class:
		'role warrior mage rogue paladin priest hunter druid warlock wizard cleric ranger bard monk',
	live: 'lives based resides home',
	lives: 'live based resides home',
	like: 'likes prefer prefers enjoy enjoys love loves favorite',
	prefer: 'prefers likes favorite',
	language: 'typescript javascript python rust golang java kotlin swift ruby',
	drink: 'coffee tea beer wine',
	work: 'works job employer',
	editor: 'vim neovim emacs vscode',
};

export function expandQuery(query: string): string {
	const tokens = normalizeClaim(query).split(/\s+/).filter(Boolean);
	const extra = tokens.flatMap((token) => RELATED[token]?.split(' ') ?? []);
	return extra.length ? `${query} ${extra.filter((t) => !tokens.includes(t)).join(' ')}` : query;
}
