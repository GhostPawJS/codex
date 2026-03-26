import { createContext } from 'preact';
import { useContext } from 'preact/hooks';

import type { CodexDb } from '../database.ts';

export interface ToastItem {
	id: number;
	message: string;
	ok: boolean;
}

export interface CodexContextValue {
	db: CodexDb;
	revision: number;
	mutate: (fn: () => void) => void;
	toast: (message: string, ok?: boolean) => void;
}

export const CodexContext = createContext<CodexContextValue | null>(null);

export function useCodex(): CodexContextValue {
	const ctx = useContext(CodexContext);
	if (!ctx) throw new Error('useCodex() called outside CodexContext.Provider');
	return ctx;
}
