/**
 * Shared types for the frontend
 * Re-exports from MCP server types for consistency
 */

// Re-export shared types from MCP module
// Frontend-specific type aliases for backwards compatibility
// MCP uses: OptionItem = string | OptionWithDescription
// Frontend uses: Option = string | NormalizedOption (where NormalizedOption is always an object)
import type { OptionWithDescription } from '../../mcp/types';

export type {
	FieldType,
	FormConfig,
	FormField,
	OptionWithDescription
} from '../../mcp/types';

/** A single option - can be a simple string or an object with label/description */
export type Option = string | OptionWithDescription;

/** Normalized option - always an object with at least a label */
export interface NormalizedOption {
	label: string;
	description?: string;
	recommended?: boolean;
}

/**
 * Form submission result from the UI
 */
export interface FormResult {
	action: 'submit' | 'skip' | 'request_explanation';
	/** Selected option for single (radio) selection */
	selection?: string;
	/** Selected options for multiple (checkbox) selection */
	selections?: string[];
	/** Additional comments provided by the user */
	comments?: string;
	/** The option for which explanation was requested */
	explainOption?: string;
}
