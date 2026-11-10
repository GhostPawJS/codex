import {
	type ImportBeliefsResult,
	importBeliefs,
	parseBeliefImport,
} from '../beliefs/import_beliefs.ts';
import type { RememberBeliefInput } from '../beliefs/types.ts';
import type { CodexDb } from '../database.ts';
import { CodexValidationError } from '../errors.ts';
import { translateToolError } from './tool_errors.ts';
import {
	arraySchema,
	booleanSchema,
	defineCodexTool,
	objectSchema,
	stringSchema,
} from './tool_metadata.ts';
import { importBeliefsToolName } from './tool_names.ts';
import { type ToolResult, toolFailure, toolSuccess } from './tool_types.ts';
import { validateToolInput } from './validate_tool_input.ts';

export interface ImportBeliefsToolInput {
	items?: RememberBeliefInput[];
	input?: string;
	dryRun?: boolean;
}
export function importBeliefsToolHandler(
	db: CodexDb,
	input: ImportBeliefsToolInput,
): ToolResult<ImportBeliefsResult> {
	const invalid = validateToolInput(importBeliefsTool.inputSchema, input);
	if (invalid) return invalid;
	try {
		if ((input.items === undefined) === (input.input === undefined))
			throw new CodexValidationError(
				'Provide exactly one of items or input (JSON array / JSON Lines).',
			);
		const result = importBeliefs(db, input.items ?? parseBeliefImport(input.input ?? ''), {
			dryRun: input.dryRun === true,
		});
		if (result.items.some((item) => item.error)) {
			const failure = toolFailure(
				'domain',
				'invalid_input',
				'Belief import rolled back.',
				'One or more items failed; no items were persisted.',
			);
			failure.error.details = { ...result };
			failure.error.recovery = 'Correct the indexed item errors and retry the whole batch.';
			return failure;
		}
		return toolSuccess(
			`${result.dryRun ? 'Validated' : 'Imported'} ${result.items.length} beliefs${result.dryRun ? ' (dry run; no writes persisted)' : ''}.`,
			result,
		);
	} catch (error) {
		return translateToolError(error, { summary: 'Could not import beliefs.' });
	}
}
export const importBeliefsTool = defineCodexTool<ImportBeliefsToolInput, ImportBeliefsResult>({
	name: importBeliefsToolName,
	description:
		'Import a JSON array or JSON Lines of beliefs atomically; report indexed ids or errors. Dry runs roll back and return provisional ids.',
	whenToUse: 'Use for batch capture of existing beliefs.',
	whenNotToUse: 'Use remember_belief for one belief and revise_belief for revisions.',
	sideEffects: 'writes_state',
	readOnly: false,
	supportsClarification: false,
	targetKinds: ['belief'],
	inputDescriptions: {
		items:
			'Belief objects with claim, source, category and optional certainty, provenance, topic, allowDuplicate.',
		input: 'JSON array or JSON Lines text, alternative to items.',
		dryRun: 'Validate using the write path and roll back.',
	},
	outputDescription:
		'Indexed ids on success (provisional for dry run). On failure error.details.items reports per-item errors; all writes roll back.',
	inputSchema: objectSchema(
		{
			items: arraySchema({}, 'Belief objects; each item is validated inside the batch.'),
			input: stringSchema('JSON array or JSON Lines text; CLI accepts @file or @- stdin.'),
			dryRun: booleanSchema('Validate and roll back; ids are provisional.'),
		},
		[],
		'Atomic belief import.',
	),
	handler: importBeliefsToolHandler,
});
