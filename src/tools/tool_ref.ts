import type { BeliefRecord } from '../beliefs/types.ts';
import type { DismissalRecord } from '../dismissals/types.ts';

import type { ToolEntityRef } from './tool_types.ts';

export function toBeliefRef(record: BeliefRecord): ToolEntityRef {
	return { kind: 'belief', id: record.id, title: record.claim };
}

export function toBeliefIdRef(id: number, claim?: string): ToolEntityRef {
	return { kind: 'belief', id, title: claim };
}

export function toDismissalRef(record: DismissalRecord): ToolEntityRef {
	return { kind: 'dismissal', id: record.beliefA, title: `${record.beliefA}↔${record.beliefB}` };
}
