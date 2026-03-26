import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import type { ToastItem } from './context.ts';

let nextId = 1;

export function useToastState() {
	const [toasts, setToasts] = useState<ToastItem[]>([]);
	const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

	const push = useCallback((message: string, ok = true) => {
		const id = nextId++;
		setToasts((prev) => [...prev.slice(-2), { id, message, ok }]);
		const timer = setTimeout(() => {
			setToasts((prev) => prev.filter((t) => t.id !== id));
			timers.current.delete(id);
		}, 4500);
		timers.current.set(id, timer);
	}, []);

	useEffect(() => {
		const map = timers.current;
		return () => {
			for (const timer of map.values()) clearTimeout(timer);
		};
	}, []);

	return { toasts, push };
}

export function ToastStack(props: { toasts: ToastItem[] }) {
	return (
		<div class="toast-stack">
			{props.toasts.map((t) => (
				<div key={t.id} class={`toast ${t.ok ? 'toast-ok' : 'toast-err'}`}>
					{t.message}
				</div>
			))}
		</div>
	);
}
