interface Segment {
	label: string;
	count: number;
	color: string;
}

export function DistributionBar(props: { segments: Segment[]; title?: string }) {
	const total = props.segments.reduce((sum, s) => sum + s.count, 0);
	if (total === 0) return null;

	return (
		<div class="dist-bar-wrap">
			{props.title && <span class="dist-title">{props.title}</span>}
			<div class="dist-track">
				{props.segments.map((seg) => {
					const pct = (seg.count / total) * 100;
					if (pct === 0) return null;
					return (
						<div
							key={seg.label}
							class="dist-segment"
							style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: seg.color }}
							title={`${seg.label}: ${seg.count}`}
						/>
					);
				})}
			</div>
			<div class="dist-legend">
				{props.segments
					.filter((s) => s.count > 0)
					.map((seg) => (
						<span key={seg.label} class="dist-legend-item">
							<span class="dist-dot" style={{ backgroundColor: seg.color }} />
							{seg.label}
						</span>
					))}
			</div>
		</div>
	);
}
