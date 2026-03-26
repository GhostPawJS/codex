import type { ComponentChildren } from 'preact';

export function Panel(props: {
	title?: string;
	subtitle?: string;
	actions?: ComponentChildren;
	children: ComponentChildren;
	class?: string;
}) {
	return (
		<section class={`panel ${props.class ?? ''}`}>
			{(props.title || props.actions) && (
				<div class="panel-header">
					<div>
						{props.title && <h2 class="panel-title">{props.title}</h2>}
						{props.subtitle && <p class="panel-subtitle">{props.subtitle}</p>}
					</div>
					{props.actions && <div class="panel-actions">{props.actions}</div>}
				</div>
			)}
			<div class="panel-body">{props.children}</div>
		</section>
	);
}
