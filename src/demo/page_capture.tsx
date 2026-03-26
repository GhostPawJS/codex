import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import {
	BELIEF_CATEGORIES,
	BELIEF_SOURCES,
	type BeliefCategory,
	type BeliefSource,
} from '../beliefs/types.ts';
import * as read from '../read.ts';
import * as write from '../write.ts';
import { useCodex } from './context.ts';
import { suggestCategory } from './format.ts';
import { navigate } from './router.ts';
import { Badge, BeliefCard, CertaintyBar, Panel, PillSelector } from './ui/index.ts';

export function PageCapture() {
	const { db, revision, mutate, toast } = useCodex();

	const [claim, setClaim] = useState('');
	const [source, setSource] = useState<BeliefSource>('explicit');
	const [category, setCategory] = useState<BeliefCategory>('fact');
	const [provenance, setProvenance] = useState('');
	const [showProvenance, setShowProvenance] = useState(false);
	const [matches, setMatches] = useState<ReturnType<typeof read.recall>>([]);
	const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	const search = useCallback(
		(query: string) => {
			if (query.trim().length < 3) {
				setMatches([]);
				return;
			}
			try {
				const results = read
					.recall(db, query, { minScore: 0, limit: 5 })
					.filter((r) => r.scoreParts.semanticSimilarity >= 0.3);
				setMatches(results);
			} catch {
				setMatches([]);
			}
		},
		[db],
	);

	useEffect(() => {
		if (debounce.current) clearTimeout(debounce.current);
		debounce.current = setTimeout(() => search(claim), 300);
		return () => {
			if (debounce.current) clearTimeout(debounce.current);
		};
	}, [claim, search, revision]);

	useEffect(() => {
		const suggestion = suggestCategory(claim);
		if (suggestion) setCategory(suggestion);
	}, [claim]);

	const handleRemember = () => {
		if (!claim.trim()) return;
		mutate(() => {
			const result = write.remember(db, {
				claim: claim.trim(),
				source,
				category,
				provenance: provenance.trim() || undefined,
			});
			const prox = result.proximity.length;
			toast(
				`Held. ${prox > 0 ? `Near ${prox} existing belief${prox > 1 ? 's' : ''}.` : 'No nearby beliefs.'}`,
			);
		});
		setClaim('');
		setProvenance('');
		setMatches([]);
	};

	const handleConfirm = (id: number) => {
		mutate(() => {
			write.confirmBelief(db, id);
			toast('Confirmed.');
		});
		setClaim('');
		setMatches([]);
	};

	const handleCorrect = (id: number) => {
		if (!claim.trim()) return;
		mutate(() => {
			write.correctBelief(db, id, { claim: claim.trim(), source, category });
			toast('Corrected. Old belief superseded.');
		});
		setClaim('');
		setMatches([]);
	};

	return (
		<div class="page">
			<h1 class="page-title">Capture</h1>

			<Panel>
				<textarea
					ref={textareaRef}
					class="capture-input"
					placeholder="What do you believe?"
					value={claim}
					rows={2}
					onInput={(e) => setClaim((e.target as HTMLTextAreaElement).value)}
					onKeyDown={(e) => {
						if (e.key === 'Enter' && !e.shiftKey) {
							e.preventDefault();
							handleRemember();
						}
					}}
				/>

				<div class="capture-controls">
					<PillSelector
						label="Source"
						options={BELIEF_SOURCES}
						value={source}
						onChange={setSource}
					/>
					<PillSelector
						label="Category"
						options={BELIEF_CATEGORIES}
						value={category}
						onChange={setCategory}
					/>
				</div>

				<div class="capture-extra">
					{!showProvenance ? (
						<button
							type="button"
							class="btn btn-muted btn-sm"
							onClick={() => setShowProvenance(true)}
						>
							+ Add provenance
						</button>
					) : (
						<input
							type="text"
							class="inline-input"
							placeholder="Provenance (e.g. source document, conversation)"
							value={provenance}
							onInput={(e) => setProvenance((e.target as HTMLInputElement).value)}
						/>
					)}
				</div>

				{claim.trim().length > 0 && (
					<button type="button" class="btn btn-primary capture-submit" onClick={handleRemember}>
						Remember{matches.length > 0 ? ' as new' : ''}
					</button>
				)}
			</Panel>

			{matches.length > 0 && (
				<Panel title="Nearby beliefs" subtitle="You may already hold something similar.">
					<div class="capture-matches">
						{matches.map((m) => (
							<div key={m.id} class="capture-match-card">
								<BeliefCard belief={m} compact onClick={() => navigate(`detail/${m.id}`)}>
									<div class="belief-bar-row">
										<span class="bar-inline-label">certainty</span>
										<CertaintyBar value={m.certainty} />
									</div>
									<div class="belief-meta">
										<Badge label={m.source} variant="source" />
									</div>
								</BeliefCard>
								{/* biome-ignore lint/a11y/noStaticElementInteractions: stop-propagation container */}
								<div
									class="capture-match-actions"
									role="presentation"
									onClick={(e) => e.stopPropagation()}
								>
									<button
										type="button"
										class="btn btn-confirm btn-sm"
										onClick={() => handleConfirm(m.id)}
									>
										Confirm existing
									</button>
									<button
										type="button"
										class="btn btn-correct btn-sm"
										onClick={() => handleCorrect(m.id)}
									>
										Update existing
									</button>
									<button type="button" class="btn btn-primary btn-sm" onClick={handleRemember}>
										Keep both
									</button>
								</div>
							</div>
						))}
					</div>
				</Panel>
			)}
		</div>
	);
}
