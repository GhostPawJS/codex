import type { BeliefRecord, FlagReasonCode, StrengthTier } from '../../beliefs/types.ts';
import { relativeTime } from '../format.ts';
import { navigate } from '../router.ts';
import { Badge, EvidenceBadge } from './badge.tsx';
import { CertaintyBar } from './bars.tsx';

export function BeliefCard(props: {
	belief: BeliefRecord;
	reasonCodes?: FlagReasonCode[];
	compact?: boolean;
	onClick?: () => void;
	children?: preact.ComponentChildren;
}) {
	const { belief, reasonCodes, compact } = props;
	const strengthClass = `strength-${belief.strength}` as `strength-${StrengthTier}`;

	const handleClick = () => {
		if (props.onClick) props.onClick();
		else navigate(`detail/${belief.id}`);
	};

	return (
		// biome-ignore lint/a11y/useSemanticElements: card contains nested interactive content
		<div
			class={`belief-card ${strengthClass}`}
			role="button"
			tabIndex={0}
			onClick={handleClick}
			onKeyDown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') handleClick();
			}}
		>
			<div class="belief-claim">{belief.claim}</div>
			{!compact && (
				<div class="belief-meta">
					<Badge label={belief.source} variant="source" />
					<Badge label={belief.category} variant="category" />
					<EvidenceBadge count={belief.evidence} />
					<span class="belief-age">{relativeTime(belief.verifiedAt)}</span>
				</div>
			)}
			{reasonCodes && reasonCodes.length > 0 && (
				<div class="belief-reasons">
					{reasonCodes.map((code) => (
						<Badge key={code} label={code} variant="reason" />
					))}
				</div>
			)}
			{!compact && (
				<div class="belief-bar-row">
					<span class="bar-inline-label">certainty</span>
					<CertaintyBar value={belief.certainty} />
				</div>
			)}
			{props.children}
		</div>
	);
}
