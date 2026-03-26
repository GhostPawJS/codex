import { navigate, useCurrentRoute } from './router.ts';

const NAV_ITEMS = [
	{ path: '', label: 'Dashboard', icon: '◈' },
	{ path: 'capture', label: 'Capture', icon: '◎' },
	{ path: 'flags', label: 'Flags', icon: '⚑' },
	{ path: 'log', label: 'Log', icon: '▤' },
];

export function Sidebar(props: {
	open: boolean;
	onToggle: () => void;
	onReset: (mode: 'seeded' | 'blank') => void;
	flagCount: number;
	integrity: number;
}) {
	const route = useCurrentRoute();
	const basePath = route.split('/')[0] ?? '';

	return (
		<>
			<button type="button" class="hamburger" onClick={props.onToggle} aria-label="Toggle menu">
				☰
			</button>
			{/* biome-ignore lint/a11y/noStaticElementInteractions: backdrop dismiss */}
			{props.open && <div class="sidebar-backdrop" role="presentation" onClick={props.onToggle} />}
			<nav class={`sidebar ${props.open ? 'sidebar-open' : ''}`}>
				<div class="sidebar-brand">
					<span class="sidebar-logo">R</span>
					<span class="sidebar-title">Codex</span>
				</div>
				<div class="sidebar-nav">
					{NAV_ITEMS.map((item) => (
						<button
							key={item.path}
							type="button"
							class={`nav-item ${basePath === item.path ? 'nav-active' : ''}`}
							onClick={() => {
								navigate(item.path);
								props.onToggle();
							}}
						>
							<span class="nav-icon">{item.icon}</span>
							<span class="nav-label">{item.label}</span>
							{item.path === 'flags' && props.flagCount > 0 && (
								<span class="nav-badge">{props.flagCount}</span>
							)}
						</button>
					))}
				</div>
				<div class="sidebar-footer">
					<div class="sidebar-integrity">
						<span class="sidebar-integrity-label">Integrity</span>
						<span class="sidebar-integrity-value">{Math.round(props.integrity)}%</span>
					</div>
					<div class="sidebar-reset-row">
						<button
							type="button"
							class="btn btn-muted btn-sm"
							onClick={() => props.onReset('seeded')}
						>
							Reset seeded
						</button>
						<button
							type="button"
							class="btn btn-muted btn-sm"
							onClick={() => props.onReset('blank')}
						>
							Reset blank
						</button>
					</div>
				</div>
			</nav>
		</>
	);
}
