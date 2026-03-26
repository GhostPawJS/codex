const SOURCE_COLORS: Record<string, string> = {
	explicit: '#72f1b8',
	observed: '#61dafb',
	distilled: '#c4a7ff',
	inferred: '#ffc857',
};

const CATEGORY_COLORS: Record<string, string> = {
	preference: '#ff9ecd',
	fact: '#61dafb',
	procedure: '#72f1b8',
	capability: '#ffc857',
	custom: '#93a4bf',
};

const REASON_COLORS: Record<string, string> = {
	stale: '#ff7a90',
	fading: '#ffa07a',
	single_evidence: '#ffc857',
	unstable: '#c4a7ff',
	low_trust: '#ff9ecd',
	gap: '#93a4bf',
};

const STRENGTH_COLORS: Record<string, string> = {
	strong: '#72f1b8',
	fading: '#ffc857',
	faint: '#93a4bf',
};

const LOG_TYPE_COLORS: Record<string, string> = {
	remembered: '#61dafb',
	confirmed: '#72f1b8',
	revised: '#ffc857',
	forgotten: '#ff7a90',
	merged: '#93a4bf',
};

type BadgeVariant = 'source' | 'category' | 'reason' | 'strength' | 'logType' | 'neutral';

const COLOR_MAPS: Record<string, Record<string, string>> = {
	source: SOURCE_COLORS,
	category: CATEGORY_COLORS,
	reason: REASON_COLORS,
	strength: STRENGTH_COLORS,
	logType: LOG_TYPE_COLORS,
};

export function Badge(props: { label: string; variant?: BadgeVariant }) {
	const variant = props.variant ?? 'neutral';
	const map = COLOR_MAPS[variant];
	const bg = map?.[props.label] ?? '#93a4bf';

	return (
		<span class="badge" style={{ backgroundColor: bg, color: '#0a0d12' }}>
			{props.label.replace(/_/g, ' ')}
		</span>
	);
}

export function EvidenceBadge(props: { count: number }) {
	return <span class="badge badge-evidence">{props.count}x confirmed</span>;
}
