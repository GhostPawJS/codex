/**
 * Returns the provided timestamp or the current wall-clock time.
 */
export function resolveNow(now?: number): number {
	return now ?? Date.now();
}
