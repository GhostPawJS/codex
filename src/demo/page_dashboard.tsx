import { useMemo } from 'preact/hooks';
import * as read from '../read.ts';
import { useCodex } from './context.ts';
import { percent } from './format.ts';
import { navigate } from './router.ts';
import { DistributionBar, IntegrityArc, Panel } from './ui/index.ts';

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

export function PageDashboard() {
	const { db, revision } = useCodex();
	const status = useMemo(() => read.getStatus(db), [db, revision]);
	const flags = useMemo(() => read.listFlags(db), [db, revision]);
	const trends = useMemo(() => read.getTrends(db), [db, revision]);

	const sourceSegments = Object.entries(status.sourceCounts).map(([label, count]) => ({
		label,
		count,
		color: SOURCE_COLORS[label] ?? '#93a4bf',
	}));
	const categorySegments = Object.entries(status.categoryCounts).map(([label, count]) => ({
		label,
		count,
		color: CATEGORY_COLORS[label] ?? '#93a4bf',
	}));

	return (
		<div class="page">
			<h1 class="page-title">Dashboard</h1>

			<div class="explainer">
				This is a live demo running entirely in your browser. Nothing is saved. Use the sidebar to
				navigate, or jump to{' '}
				<a href="#capture" class="explainer-link">
					Capture
				</a>
				,{' '}
				<a href="#flags" class="explainer-link">
					Flags
				</a>
				, or{' '}
				<a href="#log" class="explainer-link">
					Log
				</a>
				.
			</div>

			<div class="dash-top">
				<Panel class="dash-integrity">
					<div class="dash-integrity-inner">
						<IntegrityArc value={status.integrity} size={130} />
						<div class="dash-integrity-meta">
							<span class="dash-stat-label">Portfolio Integrity</span>
							<span class="dash-stat-detail">
								{status.activeBeliefCount} active of {status.totalBeliefCount} total
							</span>
						</div>
					</div>
				</Panel>

				<div class="dash-stats-grid">
					{/* biome-ignore lint/a11y/useSemanticElements: stat card with complex layout */}
					<div
						class="stat-card"
						role="button"
						tabIndex={0}
						onClick={() => navigate('flags')}
						onKeyDown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') navigate('flags');
						}}
					>
						<span class="stat-value stat-warn">{flags.length}</span>
						<span class="stat-label">Flagged</span>
					</div>
					<div class="stat-card">
						<span class="stat-value stat-success">{status.strengthCounts.strong}</span>
						<span class="stat-label">Strong</span>
					</div>
					<div class="stat-card">
						<span class="stat-value stat-fading">{status.strengthCounts.fading}</span>
						<span class="stat-label">Fading</span>
					</div>
					<div class="stat-card">
						<span class="stat-value stat-faint">{status.strengthCounts.faint}</span>
						<span class="stat-label">Faint</span>
					</div>
				</div>
			</div>

			<Panel title="Distributions">
				<DistributionBar segments={sourceSegments} title="Sources" />
				<DistributionBar segments={categorySegments} title="Categories" />
			</Panel>

			<Panel title="Trends">
				<div class="trends-row">
					{trends.growingCategories.length > 0 && (
						<div class="trend-item">
							<span class="trend-label">Growing</span>
							<span class="trend-value">
								{trends.growingCategories.map((g) => `${g.category} (${g.count})`).join(', ')}
							</span>
						</div>
					)}
					<div class="trend-item">
						<span class="trend-label">Avg certainty</span>
						<span class="trend-value">{percent(status.averageCertainty * 100)}</span>
					</div>
					<div class="trend-item">
						<span class="trend-label">Avg freshness</span>
						<span class="trend-value">{percent(status.averageFreshness * 100)}</span>
					</div>
					{trends.calibrationAlerts.length > 0 && (
						<div class="trend-item trend-alert">
							<span class="trend-label">Calibration</span>
							<span class="trend-value">{trends.calibrationAlerts[0]}</span>
						</div>
					)}
				</div>
			</Panel>
		</div>
	);
}
