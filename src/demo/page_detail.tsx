import { useMemo } from 'preact/hooks';
import * as read from '../read.ts';
import * as write from '../write.ts';
import { useCodex } from './context.ts';
import { relativeTime } from './format.ts';
import { navigate } from './router.ts';
import { Badge, BeliefActions, BeliefCard, CertaintyBar, FreshnessBar, Panel } from './ui/index.ts';

export function PageDetail(props: { beliefId: number }) {
	const { db, revision, mutate, toast } = useCodex();
	const detail = useMemo(
		() => read.getBeliefDetail(db, props.beliefId),
		[db, props.beliefId, revision],
	);
	const lineage = useMemo(
		() => read.getBeliefLineage(db, props.beliefId),
		[db, props.beliefId, revision],
	);

	if (!detail) {
		return (
			<div class="page">
				<button type="button" class="btn btn-muted" onClick={() => navigate('flags')}>
					← Back
				</button>
				<p class="muted" style={{ marginTop: '20px' }}>
					Belief not found.
				</p>
			</div>
		);
	}

	const handleConfirm = () => {
		mutate(() => {
			write.confirmBelief(db, detail.id);
			toast('Confirmed.');
		});
	};
	const handleCorrect = (newClaim: string) => {
		mutate(() => {
			const result = write.correctBelief(db, detail.id, { claim: newClaim });
			toast('Corrected.');
			navigate(`detail/${result.id}`);
		});
	};
	const handleForget = () => {
		mutate(() => {
			write.forgetBelief(db, detail.id);
			toast('Forgotten.');
		});
	};
	const handleDefer = (until: number) => {
		mutate(() => {
			write.deferBelief(db, detail.id, until);
			toast('Deferred.');
		});
	};
	const handleDelete = () => {
		mutate(() => {
			write.deleteBelief(db, detail.id);
			toast('Deleted permanently.');
			navigate('flags');
		});
	};
	const handleDismiss = (otherId: number) => {
		mutate(() => {
			write.dismissProximityPair(db, detail.id, otherId);
			toast('Proximity dismissed.');
		});
	};

	return (
		<div class="page">
			<button type="button" class="btn btn-muted" onClick={() => navigate('flags')}>
				← Back to Flags
			</button>

			<Panel class="detail-header-panel">
				<h1 class={`detail-claim ${detail.isActive ? '' : 'detail-superseded'}`}>{detail.claim}</h1>
				<div class="detail-status-row">
					<Badge label={detail.strength} variant="strength" />
					<Badge label={detail.isActive ? 'active' : 'superseded'} variant="neutral" />
					<Badge label={detail.source} variant="source" />
					<Badge label={detail.category} variant="category" />
				</div>
			</Panel>

			<div class="detail-metrics">
				<div class="metric-card">
					<span class="metric-label">Certainty</span>
					<CertaintyBar value={detail.certainty} />
				</div>
				<div class="metric-card">
					<span class="metric-label">Evidence</span>
					<span class="metric-value">{detail.evidence}</span>
					<span class="metric-sublabel">confirmations</span>
				</div>
				<div class="metric-card">
					<span class="metric-label">Freshness</span>
					<FreshnessBar value={detail.freshness} />
				</div>
				<div class="metric-card">
					<span class="metric-label">Age</span>
					<span class="metric-value-text">{relativeTime(detail.createdAt)}</span>
				</div>
			</div>

			{detail.provenance && (
				<div class="detail-provenance">
					<span class="provenance-label">origin:</span> {detail.provenance}
				</div>
			)}

			{detail.versionDiff && (
				<Panel title="Version diff">
					<div class="version-diff">
						<div class="diff-before">{detail.versionDiff.before}</div>
						<div class="diff-after">{detail.versionDiff.after}</div>
					</div>
				</Panel>
			)}

			{lineage.length > 1 && (
				<Panel title="Lineage">
					<div class="lineage-timeline">
						{lineage.map((entry) => (
							// biome-ignore lint/a11y/useSemanticElements: timeline node with complex layout
							<div
								key={entry.id}
								class={`lineage-node ${entry.id === detail.id ? 'lineage-current' : ''} ${entry.isActive ? '' : 'lineage-superseded'}`}
								role="button"
								tabIndex={0}
								onClick={() => {
									if (entry.id !== detail.id) navigate(`detail/${entry.id}`);
								}}
								onKeyDown={(e) => {
									if ((e.key === 'Enter' || e.key === ' ') && entry.id !== detail.id)
										navigate(`detail/${entry.id}`);
								}}
							>
								<span class="lineage-marker" />
								<div class="lineage-body">
									<span class="lineage-claim">{entry.claim}</span>
									<span class="lineage-time">{relativeTime(entry.createdAt)}</span>
								</div>
							</div>
						))}
					</div>
				</Panel>
			)}

			{detail.proximity.length > 0 && (
				<Panel title="Nearby beliefs">
					{detail.proximity.map((prox) => (
						<div key={prox.id} class="prox-row">
							<BeliefCard belief={prox} compact />
							{/* biome-ignore lint/a11y/noStaticElementInteractions: stop-propagation container */}
							<div class="prox-actions" role="presentation" onClick={(e) => e.stopPropagation()}>
								<span class="prox-sim">{Math.round(prox.similarity * 100)}% similar</span>
								<button
									type="button"
									class="btn btn-muted btn-sm"
									onClick={() => handleDismiss(prox.id)}
								>
									Dismiss
								</button>
							</div>
						</div>
					))}
				</Panel>
			)}

			{detail.isActive && (
				<Panel title="Actions">
					<BeliefActions
						onConfirm={handleConfirm}
						onCorrect={handleCorrect}
						onForget={handleForget}
						onDefer={handleDefer}
						onDelete={handleDelete}
						oldClaim={detail.claim}
					/>
				</Panel>
			)}
		</div>
	);
}
