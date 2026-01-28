/**
 * Shared type definitions for mcp-popup-ui
 */

// ============================================================================
// Tool Input Types
// ============================================================================

/**
 * An option can be a simple string or an object with label + description.
 * Description supports Markdown (rendered as plain text in v1, HTML in future).
 */
export interface OptionWithDescription {
	/** The option value/label shown to the user and returned on selection */
	label: string;
	/** Optional description with additional context (supports Markdown) */
	description?: string;
	/** If true, this option will be highlighted as the recommended choice */
	recommended?: boolean;
}

/** Options can be simple strings or objects with descriptions */
export type OptionItem = string | OptionWithDescription;

export interface SelectSingleInput {
	options?: OptionItem[];
	title?: string;
	description?: string;
	allow_other?: boolean;
	other_label?: string;
}

export interface SelectMultipleInput {
	options?: OptionItem[];
	title?: string;
	description?: string;
	allow_other?: boolean;
	other_label?: string;
}

// ============================================================================
// Tool Output Types
// ============================================================================

export interface SelectSingleOutput {
	action: 'submit' | 'skip' | 'request_explanation';
	selection?: string;
	/** Additional comments provided by the user */
	comments?: string;
	/** The option for which explanation was requested (only when action is 'request_explanation') */
	explainOption?: string;
	/** A pre-formatted message asking for explanation (only when action is 'request_explanation') */
	explainMessage?: string;
}

export interface SelectMultipleOutput {
	action: 'submit' | 'skip' | 'request_explanation';
	selections?: string[];
	/** Additional comments provided by the user */
	comments?: string;
	/** The option for which explanation was requested (only when action is 'request_explanation') */
	explainOption?: string;
	/** A pre-formatted message asking for explanation (only when action is 'request_explanation') */
	explainMessage?: string;
}

// ============================================================================
// Form Configuration Types
// ============================================================================

export type FieldType = 'radio' | 'checkbox';

export interface FormField {
	type: FieldType;
	name: string;
	options: OptionItem[];
	allowOther?: boolean;
	otherLabel?: string;
}

export interface FormConfig {
	title?: string;
	description?: string;
	field: FormField;
	submitLabel?: string;
	skipLabel?: string;
}

// ============================================================================
// HTTP Response Types
// ============================================================================

export interface FormResponseData {
	/** Selected value for radio (single selection) */
	selection?: string;
	/** Selected values for checkbox (multiple selection) */
	selections?: string[];
	/** Additional comments from user */
	comments?: string;
	/** Option label for explanation request */
	explainOption?: string;
}

export interface FormResponse {
	action: 'submit' | 'skip' | 'request_explanation';
	data: FormResponseData;
}
