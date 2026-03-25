import { useEffect, useMemo, useState } from 'preact/hooks';
import { initCodexTables } from '../init_codex_tables.ts';
import * as read from '../read.ts';
import { openBrowserCodexDb } from './browser_codex_db.ts';
import { DemoContext } from './context.ts';
import { seedDemoSession } from './demo_session.ts';
import { Card } from './ui.tsx';

export function App() {
	const [db, setDb] = useState<Awaited<ReturnType<typeof openBrowserCodexDb>> | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [query, setQuery] = useState('api');

	useEffect(() => {
		void (async () => {
			try {
				const nextDb = await openBrowserCodexDb();
				initCodexTables(nextDb);
				seedDemoSession(nextDb);
				setDb(nextDb);
			} catch (caught) {
				setError(caught instanceof Error ? caught.message : 'Failed to start Codex demo.');
			} finally {
				setLoading(false);
			}
		})();
	}, []);

	const status = useMemo(() => (db ? read.getStatus(db) : null), [db]);
	const flags = useMemo(() => (db ? read.listFlags(db) : []), [db]);
	const recallResults = useMemo(
		() => (db ? read.recall(db, query, { minScore: 0 }) : []),
		[db, query],
	);

	return (
		<DemoContext.Provider value={{ db, error, loading }}>
			<div class="shell">
				<section class="hero">
					<div class="row">
						<span class="pill">local-first belief engine</span>
						<span class="pill">fts + vector reranking</span>
					</div>
					<h1>Codex Demo</h1>
					<p class="muted">
						A compact belief console stub showing status, flags, and recall over an in-browser Codex
						database.
					</p>
					{loading ? <p>Loading...</p> : null}
					{error ? <p>{error}</p> : null}
				</section>
				<div class="grid">
					<Card title="Status">
						<div class="item">
							<strong>Integrity</strong>
							<span class="stat">{status ? `${status.integrity.toFixed(0)}%` : '0%'}</span>
						</div>
						<div class="item">
							<strong>Active beliefs</strong>
							<span class="stat">{status?.activeBeliefCount ?? 0}</span>
						</div>
					</Card>
					<Card title="Flags">
						{flags.length === 0 ? (
							<div class="item">No flags yet.</div>
						) : (
							flags.slice(0, 5).map((flag) => (
								<div class="item" key={flag.id}>
									<strong>{flag.claim}</strong>
									<span class="muted">{flag.reasonCodes.join(', ')}</span>
								</div>
							))
						)}
					</Card>
					<Card title="Recall">
						<input
							value={query}
							onInput={(event) => setQuery((event.target as HTMLInputElement).value)}
							placeholder="search beliefs"
						/>
						{recallResults.length === 0 ? (
							<div class="item">No recall results.</div>
						) : (
							recallResults.slice(0, 5).map((result) => (
								<div class="item" key={result.id}>
									<strong>{result.claim}</strong>
									<span class="muted">score {result.recallScore.toFixed(4)}</span>
								</div>
							))
						)}
					</Card>
				</div>
			</div>
		</DemoContext.Provider>
	);
}
