export function computeEvidenceFloor(evidence: number, evidenceFloorK = 5): number {
	return 1 - Math.exp(-Math.max(0, evidence) / evidenceFloorK);
}

export function computeRecallWeight(
	certainty: number,
	freshness: number,
	evidence: number,
	evidenceFloorK = 5,
): number {
	return certainty * Math.max(freshness, computeEvidenceFloor(evidence, evidenceFloorK));
}
