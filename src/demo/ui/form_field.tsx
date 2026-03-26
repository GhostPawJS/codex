import type { ComponentChildren } from 'preact';

export function FormField(props: { label: string; htmlFor?: string; children: ComponentChildren }) {
	return (
		<div class="form-field">
			<span class="form-label">{props.label}</span>
			{props.children}
		</div>
	);
}

export function PillSelector<T extends string>(props: {
	options: readonly T[];
	value: T;
	onChange: (v: T) => void;
	label?: string;
}) {
	return (
		<div class="pill-selector">
			{props.label && <span class="form-label">{props.label}</span>}
			<div class="pill-row">
				{props.options.map((opt) => (
					<button
						key={opt}
						type="button"
						class={`pill-btn ${props.value === opt ? 'pill-active' : ''}`}
						onClick={() => props.onChange(opt)}
					>
						{opt}
					</button>
				))}
			</div>
		</div>
	);
}
