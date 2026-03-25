export type CodexErrorCode = 'conflict' | 'invariant' | 'not_found' | 'state' | 'validation';

export class CodexError extends Error {
	readonly code: CodexErrorCode;

	constructor(code: CodexErrorCode, message: string) {
		super(message);
		this.name = 'CodexError';
		this.code = code;
	}
}

export class CodexConflictError extends CodexError {
	constructor(message: string) {
		super('conflict', message);
		this.name = 'CodexConflictError';
	}
}

export class CodexInvariantError extends CodexError {
	constructor(message: string) {
		super('invariant', message);
		this.name = 'CodexInvariantError';
	}
}

export class CodexNotFoundError extends CodexError {
	constructor(message: string) {
		super('not_found', message);
		this.name = 'CodexNotFoundError';
	}
}

export class CodexStateError extends CodexError {
	constructor(message: string) {
		super('state', message);
		this.name = 'CodexStateError';
	}
}

export class CodexValidationError extends CodexError {
	constructor(message: string) {
		super('validation', message);
		this.name = 'CodexValidationError';
	}
}

export function isCodexError(value: unknown): value is CodexError {
	return value instanceof CodexError;
}
