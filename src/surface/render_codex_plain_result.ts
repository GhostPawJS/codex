import { getStrengthTier } from '../beliefs/map_belief_row.ts';
import type { BeliefRecord } from '../beliefs/types.ts';
import type { SurfaceTool } from '../surfaces/surface_types.ts';

export function renderCodexPlainResult(
	result: unknown,
	tool: Pick<SurfaceTool<unknown>, 'name'>,
	input: Record<string, unknown>,
	quiet = false,
	compact = false,
): string {
	const record = result as {
		summary: string;
		data: {
			supersededId?: number;
			nearest?: { id: number; claim: string; similarity: number };
			results?: BeliefRecord[];
			payload?: { view: string; data: unknown };
			belief?: BeliefRecord & { proximity?: BeliefRecord[] };
			detail?: BeliefRecord & { proximity?: BeliefRecord[]; activeSuccessorId?: number | null };
			lineage?: BeliefRecord[];
			proximity?: BeliefRecord[];
			deletedIds?: number[];
			dismissal?: { id: number };
		};
	};
	const data = record.data;
	const flatten = (value: unknown, prefix = ''): [string, string][] => {
		if (Array.isArray(value))
			return [
				[
					prefix,
					value
						.map((entry) =>
							entry !== null && typeof entry === 'object'
								? Object.values(entry).map(String).join(' ')
								: String(entry),
						)
						.join(', ') || 'none',
				],
			];
		if (value !== null && typeof value === 'object')
			return Object.entries(value).flatMap(([key, entry]) =>
				flatten(entry, prefix ? `${prefix}.${key}` : key),
			);
		return [
			[
				prefix,
				typeof value === 'number' && !Number.isInteger(value)
					? String(Math.round(value * 100) / 100)
					: String(value),
			],
		];
	};
	const block = (pairs: [string, string][]) => {
		const width = Math.max(...pairs.map(([key]) => key.length));
		return pairs.map(([key, value]) => `${`${key}:`.padEnd(width + 2)}${value}`).join('\n');
	};
	const date = (value: number) => {
		const d = new Date(value);
		const pad = (n: number) => String(n).padStart(2, '0');
		return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())} ${new Intl.DateTimeFormat(undefined, { timeZoneName: 'short' }).formatToParts(d).find((part) => part.type === 'timeZoneName')?.value ?? ''}`;
	};
	const claim = (text: string) => text.replace(/\s+/g, ' ').trim();
	const line = (belief: BeliefRecord & { reasonCodes?: string[] }) =>
		`${belief.id}  ${claim(belief.claim)}  [${belief.certainty.toFixed(2)} ${belief.source} ${belief.strength}]${belief.provenance ? ` provenance: ${belief.provenance}` : ''}${belief.reasonCodes ? ` flags: ${belief.reasonCodes.join(',')}` : ''}`;
	if (data.payload?.view === 'duplicates') {
		const pairs = data.payload.data as {
			beliefA: number;
			beliefB: number;
			claimA: string;
			claimB: string;
			similarity: number;
		}[];
		if (quiet) return pairs.map((pair) => `${pair.beliefA} ${pair.beliefB}\n`).join('');
		return pairs.length
			? pairs
					.map(
						(pair) =>
							`#${pair.beliefA} #${pair.beliefB} ${pair.similarity.toFixed(2)} ${JSON.stringify(claim(pair.claimA).slice(0, 50))} | ${JSON.stringify(claim(pair.claimB).slice(0, 50))}\n`,
					)
					.join('')
			: `${record.summary}\n`;
	}
	if (data.payload?.view === 'status' && input.byPrefix) {
		if (quiet) return '';
		const status = data.payload.data as { prefixCounts: { prefix: string; count: number }[] };
		return status.prefixCounts.map(({ prefix, count }) => `${count} ${prefix}\n`).join('');
	}
	const list =
		data.results ??
		(Array.isArray(data.payload?.data)
			? (data.payload.data as (BeliefRecord & { type?: string })[])
			: undefined);
	if (list) {
		if (quiet) return list.map((belief) => `${belief.id}\n`).join('');
		return `${list.length ? list.map((belief) => (data.payload?.view === 'log' ? `${belief.id}  ${'type' in belief ? belief.type : ''}  ${claim(belief.claim)}` : line(belief))).join('\n') : record.summary}\n`;
	}
	if (data.payload) {
		if (quiet) return '';
		if (data.payload.view === 'status') {
			const status = data.payload.data as import('../beliefs/types.ts').StatusRecord;
			return `integrity ${Math.round(status.integrity)}% of ${status.denominator} active beliefs (certainty >= 0.7 / active)\nnew, unconfirmed: ${status.newUnconfirmed} (single evidence, younger than 7 days; overlaps strength counts)\n${block(flatten(status))}\n`;
		}
		return `${block(flatten(data.payload.data))}\n`;
	}
	if (tool.name === 'import_beliefs') {
		const batch =
			record.data as unknown as import('../beliefs/import_beliefs.ts').ImportBeliefsResult;
		return quiet
			? batch.items.map((item) => `${item.id}\n`).join('')
			: `${record.summary}\n${batch.items.map((item) => `${item.index}: ${item.id}${item.duplicate ? ' (duplicate)' : ''}`).join('\n')}\n`;
	}

	const belief = data.belief ?? data.detail;
	const id =
		belief?.id ??
		(tool.name === 'retire_belief'
			? Number(input.beliefId)
			: data.dismissal
				? Number(input.beliefA)
				: undefined);
	if (quiet) return id === undefined ? '' : `${id}\n`;
	if (
		belief &&
		(['remember_belief', 'inspect_codex_item'].includes(tool.name) ||
			['correct', 'merge'].includes(String(input.action)))
	) {
		const pairs: [string, string][] = [
			'id',
			'claim',
			'certainty',
			'evidence',
			'source',
			'category',
			'strength',
		].map((key) => [
			key,
			key === 'certainty'
				? belief.certainty.toFixed(2)
				: key === 'claim'
					? claim(belief.claim)
					: String(belief[key as keyof BeliefRecord]),
		]);
		const strengthPair = pairs.find(([key]) => key === 'strength');
		if (strengthPair) strengthPair[0] = 'display strength';
		pairs.push(['integrity tier', belief.integrityTier ?? getStrengthTier(belief.certainty)]);
		if (belief.topic !== undefined) pairs.push(['topic', belief.topic]);
		if (belief.provenanceSources?.length)
			pairs.push(['sources', belief.provenanceSources.join(', ')]);
		if (belief.provenance) pairs.push(['provenance', belief.provenance]);
		if (belief.supersededBy !== null)
			pairs.push([
				'status',
				`superseded by ${data.detail?.activeSuccessorId ?? belief.supersededBy}`,
			]);
		pairs.push(['created', date(belief.createdAt)]);
		if (data.lineage) pairs.push(['lineage', data.lineage.map((entry) => entry.id).join(', ')]);
		if (data.detail?.deferredUntil) pairs.push(['deferred until', date(data.detail.deferredUntil)]);
		const nearest = data.nearest;
		const hint = nearest
			? compact
				? ` near=#${nearest.id} ${nearest.similarity.toFixed(2)} ${JSON.stringify(claim(nearest.claim).slice(0, 60))}`
				: `nearest:   #${nearest.id} ${JSON.stringify(claim(nearest.claim))} (similarity ${nearest.similarity.toFixed(2)}; merge or confirm)\n`
			: '';
		const nearby = data.proximity ?? belief.proximity ?? [];
		const superseded =
			input.action === 'correct' &&
			data.supersededId !== undefined &&
			data.supersededId !== belief.id
				? compact
					? ` superseded=#${data.supersededId}`
					: `superseded #${data.supersededId} → #${belief.id}\n`
				: '';
		return `${compact ? '' : superseded}${block(pairs)}${compact ? superseded : ''}${compact ? hint : ''}\n${compact ? '' : hint}${nearby.length ? `nearby:\n${nearby.map(line).join('\n')}\n` : ''}`;
	}
	if (input.action === 'defer' && belief?.deferredUntil)
		return `Deferred belief "${claim(belief.claim)}" until ${date(belief.deferredUntil)}. (id ${belief.id})\n`;
	return `${record.summary}${id === undefined ? '' : ` (id ${id})`}\n`;
}
