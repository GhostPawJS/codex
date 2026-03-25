import type { ComponentChildren } from 'preact';

export function Card(props: { title: string; children: ComponentChildren }) {
	return (
		<section class="card">
			<h2>{props.title}</h2>
			<div class="list">{props.children}</div>
		</section>
	);
}
