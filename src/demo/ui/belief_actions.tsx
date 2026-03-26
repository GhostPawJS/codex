import { useState } from 'preact/hooks';

export function BeliefActions(props: {
	onConfirm?: () => void;
	onCorrect?: (newClaim: string) => void;
	onForget?: () => void;
	onDefer?: (until: number) => void;
	onDelete?: () => void;
	oldClaim?: string;
}) {
	const [mode, setMode] = useState<'idle' | 'correct' | 'defer' | 'delete'>('idle');
	const [draft, setDraft] = useState('');
	const [deferDate, setDeferDate] = useState('');

	const reset = () => {
		setMode('idle');
		setDraft('');
		setDeferDate('');
	};

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: stop-propagation container
		<div class="belief-actions" role="presentation" onClick={(e) => e.stopPropagation()}>
			{mode === 'idle' && (
				<div class="action-row">
					{props.onConfirm && (
						<button type="button" class="btn btn-confirm" onClick={props.onConfirm}>
							Confirm
						</button>
					)}
					{props.onCorrect && (
						<button type="button" class="btn btn-correct" onClick={() => setMode('correct')}>
							Correct
						</button>
					)}
					{props.onForget && (
						<button type="button" class="btn btn-forget" onClick={props.onForget}>
							Forget
						</button>
					)}
					{props.onDefer && (
						<button type="button" class="btn btn-defer" onClick={() => setMode('defer')}>
							Defer
						</button>
					)}
					{props.onDelete && (
						<button type="button" class="btn btn-delete" onClick={() => setMode('delete')}>
							Delete
						</button>
					)}
				</div>
			)}
			{mode === 'correct' && (
				<div class="inline-form">
					{props.oldClaim && <div class="ghost-claim">{props.oldClaim}</div>}
					<textarea
						class="inline-textarea"
						placeholder="Corrected belief..."
						value={draft}
						onInput={(e) => setDraft((e.target as HTMLTextAreaElement).value)}
						rows={2}
					/>
					<div class="action-row">
						<button
							type="button"
							class="btn btn-confirm"
							disabled={!draft.trim()}
							onClick={() => {
								props.onCorrect?.(draft.trim());
								reset();
							}}
						>
							Submit
						</button>
						<button type="button" class="btn btn-muted" onClick={reset}>
							Cancel
						</button>
					</div>
				</div>
			)}
			{mode === 'defer' && (
				<div class="inline-form">
					<input
						type="date"
						class="inline-input"
						value={deferDate}
						onInput={(e) => setDeferDate((e.target as HTMLInputElement).value)}
					/>
					<div class="action-row">
						<button
							type="button"
							class="btn btn-defer"
							disabled={!deferDate}
							onClick={() => {
								const ts = new Date(deferDate).getTime();
								if (ts > Date.now()) {
									props.onDefer?.(ts);
									reset();
								}
							}}
						>
							Defer until
						</button>
						<button type="button" class="btn btn-muted" onClick={reset}>
							Cancel
						</button>
					</div>
				</div>
			)}
			{mode === 'delete' && (
				<div class="inline-form">
					<p class="delete-warn">This permanently removes the belief and its lineage.</p>
					<div class="action-row">
						<button
							type="button"
							class="btn btn-delete"
							onClick={() => {
								props.onDelete?.();
								reset();
							}}
						>
							Confirm delete
						</button>
						<button type="button" class="btn btn-muted" onClick={reset}>
							Cancel
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
