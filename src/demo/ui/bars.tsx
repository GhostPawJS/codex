function barColor(value: number, scheme: 'certainty' | 'freshness'): string {
	if (scheme === 'freshness') {
		if (value >= 0.7) return '#61dafb';
		if (value >= 0.4) return '#93a4bf';
		return '#5a6a80';
	}
	if (value >= 0.6) return 'var(--success)';
	if (value >= 0.3) return 'var(--warn)';
	return 'var(--danger)';
}

function Bar(props: { value: number; scheme: 'certainty' | 'freshness'; label?: string }) {
	const pct = Math.round(props.value * 100);
	return (
		<div class="bar-wrap">
			<div class="bar-track">
				<div
					class="bar-fill"
					style={{
						width: `${Math.max(4, pct)}%`,
						backgroundColor: barColor(props.value, props.scheme),
					}}
				/>
			</div>
			<span class="bar-label">{props.label ?? `${pct}%`}</span>
		</div>
	);
}

export function CertaintyBar(props: { value: number }) {
	return <Bar value={props.value} scheme="certainty" />;
}

export function FreshnessBar(props: { value: number }) {
	return <Bar value={props.value} scheme="freshness" />;
}
