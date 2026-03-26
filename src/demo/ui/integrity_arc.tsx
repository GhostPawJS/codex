function arcColor(value: number): string {
	if (value > 70) return 'var(--success)';
	if (value > 50) return 'var(--warn)';
	return 'var(--danger)';
}

export function IntegrityArc(props: { value: number; size?: number }) {
	const size = props.size ?? 120;
	const r = (size - 12) / 2;
	const circumference = 2 * Math.PI * r;
	const offset = circumference * (1 - Math.min(props.value, 100) / 100);
	const center = size / 2;

	return (
		<div class="integrity-arc" style={{ width: `${size}px`, height: `${size}px` }}>
			<svg
				viewBox={`0 0 ${size} ${size}`}
				class="integrity-svg"
				role="img"
				aria-label={`Integrity: ${Math.round(props.value)}%`}
			>
				<circle cx={center} cy={center} r={r} fill="none" stroke="var(--border)" stroke-width="6" />
				<circle
					cx={center}
					cy={center}
					r={r}
					fill="none"
					stroke={arcColor(props.value)}
					stroke-width="6"
					stroke-linecap="round"
					stroke-dasharray={circumference}
					stroke-dashoffset={offset}
					class="integrity-ring"
					transform={`rotate(-90 ${center} ${center})`}
				/>
			</svg>
			<span class="integrity-label">{Math.round(props.value)}%</span>
		</div>
	);
}
