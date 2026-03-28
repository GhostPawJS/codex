import { ok, strictEqual } from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
	codexSoul,
	codexSoulEssence,
	codexSoulTraits,
	renderCodexSoulPromptFoundation,
} from './soul.ts';

describe('codex soul', () => {
	it('exports the canonical soul shape and selected traits', () => {
		strictEqual(codexSoul.slug, 'epistemic-warden');
		strictEqual(codexSoul.name, 'Epistemic Warden');
		strictEqual(codexSoul.essence, codexSoulEssence);
		strictEqual(codexSoul.traits, codexSoulTraits);
		strictEqual(codexSoul.traits.length, 6);

		for (const trait of codexSoulTraits) {
			strictEqual(trait.principle.trim().length > 0, true);
			strictEqual(trait.provenance.trim().length > 0, true);
		}
	});

	it('renders a prompt foundation that includes the essence and every trait', () => {
		const prompt = renderCodexSoulPromptFoundation();

		ok(prompt.includes('Epistemic Warden (epistemic-warden)'));
		ok(prompt.includes(codexSoul.description));
		ok(prompt.includes(codexSoulEssence.slice(0, 80)));
		for (const trait of codexSoulTraits) {
			ok(prompt.includes(trait.principle));
			ok(prompt.includes(trait.provenance));
		}
	});
});
