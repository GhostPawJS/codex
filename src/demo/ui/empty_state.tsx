export function EmptyState(props: { glyph?: string; title: string; subtitle?: string }) {
	return (
		<div class="empty-state">
			<span class="empty-glyph">{props.glyph ?? '◇'}</span>
			<h3 class="empty-title">{props.title}</h3>
			{props.subtitle && <p class="empty-subtitle">{props.subtitle}</p>}
		</div>
	);
}
