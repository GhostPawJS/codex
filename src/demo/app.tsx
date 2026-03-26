import { useCallback, useEffect, useMemo, useState } from 'preact/hooks';
import type { CodexDb } from '../database.ts';
import { initCodexTables } from '../init_codex_tables.ts';
import * as read from '../read.ts';
import { openBrowserCodexDb } from './browser_codex_db.ts';
import { CodexContext, type CodexContextValue } from './context.ts';
import { seedDemoSession } from './demo_session.ts';
import { PageRouter } from './page_router.tsx';
import { ToastStack, useToastState } from './result_toast.tsx';
import { Sidebar } from './sidebar.tsx';

export function App() {
	const [db, setDb] = useState<CodexDb | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [revision, setRevision] = useState(0);
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const { toasts, push } = useToastState();

	const boot = useCallback(async (mode: 'seeded' | 'blank') => {
		try {
			setLoading(true);
			const nextDb = await openBrowserCodexDb();
			initCodexTables(nextDb);
			if (mode === 'seeded') seedDemoSession(nextDb);
			setDb(nextDb);
			setRevision(0);
		} catch (caught) {
			setError(caught instanceof Error ? caught.message : 'Failed to start Codex demo.');
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void boot('seeded');
	}, [boot]);

	const mutate = useCallback((fn: () => void) => {
		fn();
		setRevision((r) => r + 1);
	}, []);

	const toast = useCallback((message: string, ok = true) => push(message, ok), [push]);

	const ctx = useMemo<CodexContextValue | null>(
		() => (db ? { db, revision, mutate, toast } : null),
		[db, revision, mutate, toast],
	);

	const status = useMemo(() => (db ? read.getStatus(db) : null), [db, revision]);
	const flagCount = useMemo(() => (db ? read.listFlags(db).length : 0), [db, revision]);

	if (loading) {
		return (
			<div class="boot-screen">
				<p>Initializing Codex…</p>
			</div>
		);
	}
	if (error || !ctx) {
		return (
			<div class="boot-screen">
				<p class="boot-error">{error ?? 'Unknown error.'}</p>
			</div>
		);
	}

	return (
		<CodexContext.Provider value={ctx}>
			<Sidebar
				open={sidebarOpen}
				onToggle={() => setSidebarOpen((o) => !o)}
				onReset={(mode) => {
					void boot(mode);
					push(mode === 'seeded' ? 'Session reset with seed data.' : 'Session reset (blank).');
				}}
				flagCount={flagCount}
				integrity={status?.integrity ?? 0}
			/>
			<main class="main-content">
				<PageRouter />
			</main>
			<ToastStack toasts={toasts} />
		</CodexContext.Provider>
	);
}
