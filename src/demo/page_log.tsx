import { useMemo } from 'preact/hooks';
import * as read from '../read.ts';
import { useCodex } from './context.ts';
import { relativeTime } from './format.ts';
import { navigate } from './router.ts';
import { Badge, EmptyState, Panel } from './ui/index.ts';

export function PageLog() {
	const { db, revision } = useCodex();
	const log = useMemo(() => read.listLog(db, 50), [db, revision]);

	return (
		<div class="page">
			<h1 class="page-title">Activity Log</h1>

			{log.length === 0 ? (
				<Panel>
					<EmptyState
						glyph="▤"
						title="No activity yet."
						subtitle="Capture your first belief to see it here."
					/>
				</Panel>
			) : (
				<div class="log-list">
					{log.map((entry) => (
						// biome-ignore lint/a11y/useSemanticElements: log entry with complex layout
						<div
							key={`${entry.id}-${entry.type}`}
							class="log-entry"
							role="button"
							tabIndex={0}
							onClick={() => navigate(`detail/${entry.id}`)}
							onKeyDown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') navigate(`detail/${entry.id}`);
							}}
						>
							<Badge label={entry.type} variant="logType" />
							<span class="log-claim">{entry.claim}</span>
							<span class="log-time">{relativeTime(entry.at)}</span>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
