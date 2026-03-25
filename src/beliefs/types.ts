export const BELIEF_SOURCES = ['explicit', 'observed', 'distilled', 'inferred'] as const;
export const BELIEF_CATEGORIES = [
	'preference',
	'fact',
	'procedure',
	'capability',
	'custom',
] as const;
export const FLAG_REASON_CODES = [
	'stale',
	'fading',
	'single_evidence',
	'unstable',
	'low_trust',
	'gap',
] as const;
export const STRENGTH_TIERS = ['strong', 'fading', 'faint'] as const;

export type BeliefSource = (typeof BELIEF_SOURCES)[number];
export type BeliefCategory = (typeof BELIEF_CATEGORIES)[number];
export type FlagReasonCode = (typeof FLAG_REASON_CODES)[number];
export type StrengthTier = (typeof STRENGTH_TIERS)[number];

export interface BeliefRow {
	id: number;
	claim: string;
	claim_normalized: string;
	certainty: number;
	evidence: number;
	source: BeliefSource;
	category: BeliefCategory;
	created_at: number;
	verified_at: number;
	superseded_by: number | null;
	provenance: string | null;
	deferred_until: number | null;
	embedding: unknown;
	embedding_norm: number | null;
	embedding_dim: number | null;
	embedding_version: string | null;
}

export interface BeliefRecord {
	id: number;
	claim: string;
	claimNormalized: string;
	certainty: number;
	evidence: number;
	source: BeliefSource;
	category: BeliefCategory;
	createdAt: number;
	verifiedAt: number;
	supersededBy: number | null;
	provenance: string | null;
	deferredUntil: number | null;
	freshness: number;
	strength: StrengthTier;
	isActive: boolean;
	lastChangedAt: number;
}

export interface RecallScoreParts {
	lexicalRank: number | null;
	semanticRank: number | null;
	lexicalRrf: number;
	semanticRrf: number;
	semanticSimilarity: number;
	recallWeight: number;
	finalScore: number;
}

export interface RecallResultItem extends BeliefRecord {
	recallScore: number;
	scoreParts: RecallScoreParts;
}

export interface FlagResultItem extends BeliefRecord {
	reasonCodes: FlagReasonCode[];
	reviewPriority: number;
	lineageDepth: number;
}

export interface CertaintyDistribution {
	veryLow: number;
	low: number;
	moderate: number;
	high: number;
	veryHigh: number;
}

export interface EvidenceDistribution {
	single: number;
	few: number;
	moderate: number;
	strong: number;
}

export interface StatusRecord {
	activeBeliefCount: number;
	totalBeliefCount: number;
	integrity: number;
	strengthCounts: Record<StrengthTier, number>;
	sourceCounts: Record<BeliefSource, number>;
	categoryCounts: Record<BeliefCategory, number>;
	certaintyDistribution: CertaintyDistribution;
	evidenceDistribution: EvidenceDistribution;
	averageCertainty: number;
	averageFreshness: number;
}

export type LogRecordType = 'remembered' | 'confirmed' | 'revised' | 'forgotten' | 'merged';

export interface LogRecord {
	id: number;
	type: LogRecordType;
	at: number;
	claim: string;
}

export interface TrendRecord {
	growingCategories: Array<{ category: BeliefCategory; count: number }>;
	calibrationAlerts: string[];
	revisedHighCertaintyCount: number;
	repeatedlyRevisedCount: number;
}

export interface ProximityResultItem extends BeliefRecord {
	similarity: number;
}

export interface BeliefDetailRecord extends BeliefRecord {
	lineageDepth: number;
	proximity: ProximityResultItem[];
	versionDiff: { before: string; after: string } | null;
}

export interface WriteOptions {
	now?: number | undefined;
}

export interface RememberOptions extends WriteOptions {
	skipProximity?: boolean | undefined;
}

export interface CorrectOptions extends WriteOptions {
	skipProximity?: boolean | undefined;
}

export interface ForgetOptions extends WriteOptions {
	successorId?: number | undefined;
}

export interface RememberResult extends BeliefRecord {
	proximity: ProximityResultItem[];
}

export interface CorrectResult extends BeliefRecord {
	supersededId: number;
	proximity: ProximityResultItem[];
}

export interface RememberBeliefInput {
	claim: string;
	source: BeliefSource;
	category: BeliefCategory;
	certainty?: number | undefined;
	provenance?: string | null | undefined;
}

export interface CorrectBeliefInput {
	claim: string;
	source?: BeliefSource | undefined;
	category?: BeliefCategory | undefined;
	certainty?: number | undefined;
	provenance?: string | null | undefined;
}

export interface MergeBeliefsInput {
	beliefIds: number[];
	claim?: string | undefined;
	source?: BeliefSource | undefined;
	category?: BeliefCategory | undefined;
	certainty?: number | undefined;
	provenance?: string | null | undefined;
	successorId?: number | undefined;
}

export interface RecallOptions {
	limit?: number | undefined;
	minScore?: number | undefined;
	category?: BeliefCategory | undefined;
	source?: BeliefSource | undefined;
	now?: number | undefined;
}
