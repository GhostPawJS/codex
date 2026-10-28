import type { BeliefRecord } from '../beliefs/types.ts';
import type { SurfaceTool } from '../surfaces/surface_types.ts';

export function renderCodexPlainResult(
	result: unknown,
	tool: Pick<SurfaceTool<unknown>, 'name'>,
	input: Record<string, unknown>,
	quiet = false,
): string {
	const record = result as {
		summary: string;
		data: {
			results?: BeliefRecord[];
			payload?: { view: string; data: unknown };
			belief?: BeliefRecord & { proximity?: BeliefRecord[] };
			detail?: BeliefRecord & { proximity?: BeliefRecord[] };
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
	const list =
		data.results ??
		(Array.isArray(data.payload?.data)
			? (data.payload.data as (BeliefRecord & { type?: string })[])
			: undefined);
	if (list) {
		if (quiet) return list.map((belief) => `${belief.id}\n`).join('');
		return `${list.length ? list.map((belief) => (data.payload?.view === 'log' ? `${belief.id}  ${'type' in belief ? belief.type : ''}  ${claim(belief.claim)}` : line(belief))).join('\n') : record.summary}\n`;
	}
	if (data.payload) return quiet ? '' : `${block(flatten(data.payload.data))}\n`;
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
		if (belief.provenance) pairs.push(['provenance', belief.provenance]);
		if (belief.supersededBy !== null)
			pairs.push(['status', `superseded by ${belief.supersededBy}`]);
		pairs.push(['created', date(belief.createdAt)]);
		if (data.lineage) pairs.push(['lineage', data.lineage.map((entry) => entry.id).join(', ')]);
		if (data.detail?.deferredUntil) pairs.push(['deferred until', date(data.detail.deferredUntil)]);
		const nearby = data.proximity ?? belief.proximity ?? [];
		return `${block(pairs)}\n${nearby.length ? `nearby:\n${nearby.map(line).join('\n')}\n` : ''}`;
	}
	if (input.action === 'defer' && belief?.deferredUntil)
		return `Deferred belief "${claim(belief.claim)}" until ${date(belief.deferredUntil)}. (id ${belief.id})\n`;
	return `${record.summary}${id === undefined ? '' : ` (id ${id})`}\n`;
}
