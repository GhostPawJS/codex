import { isCodexError } from '../errors.ts';
import { searchCodexToolName } from './tool_names.ts';
import { inspectItemNext, reviewViewNext, useToolNext } from './tool_next.ts';
import type { ToolErrorCode, ToolErrorKind, ToolFailure, ToolNextStepHint } from './tool_types.ts';
import { toolFailure } from './tool_types.ts';

interface TranslateErrorOptions {
	summary?: string | undefined;
	next?: ToolNextStepHint[] | undefined;
}

function mapCodexErrorCode(code: string): { kind: ToolErrorKind; toolCode: ToolErrorCode } {
	switch (code) {
		case 'not_found':
			return { kind: 'domain', toolCode: 'not_found' };
		case 'validation':
			return { kind: 'protocol', toolCode: 'invalid_input' };
		case 'state':
		case 'conflict':
			return { kind: 'domain', toolCode: 'invalid_state' };
		default:
			return { kind: 'system', toolCode: 'system_error' };
	}
}

export function translateToolError(
	error: unknown,
	options: TranslateErrorOptions = {},
): ToolFailure {
	if (isCodexError(error)) {
		const { kind, toolCode } = mapCodexErrorCode(error.code);
		const next =
			options.next ??
			(error.code === 'not_found'
				? [
						useToolNext(
							searchCodexToolName,
							'Search for the belief by query to find its current id.',
						),
						reviewViewNext('flags', 'Check flags to find beliefs needing attention.'),
					]
				: []);
		const result = toolFailure(kind, toolCode, options.summary ?? error.message, error.message, {
			next: next.length > 0 ? next : undefined,
		});
		if (error.code === 'state' || error.code === 'conflict')
			result.error.recovery = 'Inspect the belief and choose an active id; for example beliefId=1.';
		if (error.code === 'validation')
			result.error.recovery = `Check the input fields: ${error.message.replace(/\.$/, '')}. Example: claim="Deploys go out on Tuesdays.", beliefId=1. See the tool schema for valid values.`;
		if (error.code === 'not_found') {
			result.error.recovery = / was superseded by \d+/.test(error.message)
				? 'Use the successor id shown above.'
				: 'The belief may have been superseded or deleted. Search by query to locate the current version.';
		}
		return result;
	}
	const message = error instanceof Error ? error.message : String(error);
	return toolFailure(
		'system',
		'system_error',
		options.summary ?? 'An unexpected error occurred.',
		message,
	);
}

export function withToolHandling<TArgs extends unknown[], TResult>(
	fn: (...args: TArgs) => TResult,
	options: TranslateErrorOptions = {},
): (...args: TArgs) => TResult | ToolFailure {
	return (...args: TArgs) => {
		try {
			return fn(...args);
		} catch (error) {
			return translateToolError(error, options) as TResult | ToolFailure;
		}
	};
}

export function beliefNotFoundHints(beliefId: number): ToolNextStepHint[] {
	return [
		useToolNext(
			searchCodexToolName,
			`Search by query to find the current version of belief ${beliefId}.`,
		),
		reviewViewNext('flags', 'Check flags to see beliefs needing attention.'),
	];
}

export function beliefEntityHint(beliefId: number, claim?: string): ToolNextStepHint {
	return inspectItemNext(beliefId, claim);
}
