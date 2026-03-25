export type ToolEntityKind = 'belief' | 'dismissal';
export type ToolOutcomeKind = 'success' | 'no_op' | 'needs_clarification' | 'error';
export type ToolErrorCode =
	| 'clarification_needed'
	| 'invalid_input'
	| 'invalid_state'
	| 'not_found'
	| 'system_error';
export type ToolErrorKind = 'domain' | 'protocol' | 'system';
export type ToolWarningCode = 'empty_result' | 'partial_match' | 'unchanged';
export type ToolClarificationCode =
	| 'ambiguous_action'
	| 'ambiguous_target'
	| 'missing_required_choice';
export type ToolNextStepHintKind =
	| 'ask_user'
	| 'inspect_item'
	| 'review_view'
	| 'retry_with'
	| 'use_tool';

export interface ToolEntityRef {
	kind: ToolEntityKind;
	id: number;
	title?: string | undefined;
}

export interface ToolWarning {
	code: ToolWarningCode;
	message: string;
}

export interface ToolNextStepHint {
	kind: ToolNextStepHintKind;
	message: string;
	tool?: string | undefined;
	suggestedInput?: Record<string, unknown> | undefined;
}

export interface ToolBaseResult {
	ok: boolean;
	outcome: ToolOutcomeKind;
	summary: string;
	entities: ToolEntityRef[];
	warnings?: ToolWarning[] | undefined;
	next?: ToolNextStepHint[] | undefined;
}

export interface ToolSuccess<TData> extends ToolBaseResult {
	ok: true;
	outcome: 'success' | 'no_op';
	data: TData;
}

export interface ToolNeedsClarification extends ToolBaseResult {
	ok: false;
	outcome: 'needs_clarification';
	clarification: {
		code: ToolClarificationCode;
		question: string;
		missing: string[];
	};
}

export interface ToolFailure extends ToolBaseResult {
	ok: false;
	outcome: 'error';
	error: {
		kind: ToolErrorKind;
		code: ToolErrorCode;
		message: string;
		recovery?: string | undefined;
		details?: Record<string, unknown> | undefined;
	};
}

export type ToolResult<TData> = ToolFailure | ToolNeedsClarification | ToolSuccess<TData>;

interface ToolResultOptions {
	entities?: ToolEntityRef[] | undefined;
	next?: ToolNextStepHint[] | undefined;
	warnings?: ToolWarning[] | undefined;
}

function withOptionalFields<T extends ToolBaseResult>(result: T, options: ToolResultOptions): T {
	if (options.next && options.next.length > 0) {
		result.next = options.next;
	}
	if (options.warnings && options.warnings.length > 0) {
		result.warnings = options.warnings;
	}
	return result;
}

export function toolWarning(code: ToolWarningCode, message: string): ToolWarning {
	return { code, message };
}

export function toolSuccess<TData>(
	summary: string,
	data: TData,
	options: ToolResultOptions = {},
): ToolSuccess<TData> {
	return withOptionalFields(
		{ ok: true, outcome: 'success', summary, entities: options.entities ?? [], data },
		options,
	);
}

export function toolNoOp<TData>(
	summary: string,
	data: TData,
	options: ToolResultOptions = {},
): ToolSuccess<TData> {
	return withOptionalFields(
		{ ok: true, outcome: 'no_op', summary, entities: options.entities ?? [], data },
		options,
	);
}

export function toolNeedsClarification(
	code: ToolClarificationCode,
	question: string,
	missing: string[],
	options: ToolResultOptions = {},
): ToolNeedsClarification {
	return withOptionalFields(
		{
			ok: false,
			outcome: 'needs_clarification',
			summary: question,
			entities: options.entities ?? [],
			clarification: { code, question, missing },
		},
		options,
	);
}

export function toolFailure(
	kind: ToolErrorKind,
	code: ToolErrorCode,
	summary: string,
	message: string,
	options: ToolResultOptions = {},
): ToolFailure {
	return withOptionalFields(
		{
			ok: false,
			outcome: 'error',
			summary,
			entities: options.entities ?? [],
			error: { kind, code, message },
		},
		options,
	);
}
