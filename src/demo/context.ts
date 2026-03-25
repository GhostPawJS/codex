import { createContext } from 'preact';

import type { CodexDb } from '../database.ts';

export interface DemoContextValue {
	db: CodexDb | null;
	error: string | null;
	loading: boolean;
}

export const DemoContext = createContext<DemoContextValue>({
	db: null,
	error: null,
	loading: true,
});
