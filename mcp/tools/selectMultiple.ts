/**
 * ask_user_multiple tool implementation
 * Displays checkboxes for multiple option selection
 */

import { serveFormAndAwaitResponse } from '../http/index.js';
import type {
	SelectMultipleInput,
	SelectMultipleOutput,
	FormConfig
} from '../types/index.js';

/**
 * Tool definition for MCP registration
 */
export const askUserMultipleDefinition = {
	name: 'ask_user_multiple',
	description: `Ask the user to choose ONE OR MORE options from a list. Use this tool instead of listing options in your text response whenever the user can select multiple items.

WHEN TO USE THIS TOOL:
- You are about to list items and ask "which ones do you want?" or "select all that apply"
- The user can pick multiple non-exclusive options (e.g., "Which features to include?", "Which files to modify?", "What languages do you know?")
- You need to gather multiple preferences at once

EXAMPLES OF WHEN TO USE:
- "Which features do you want?" → Use this tool
- "Select the files to include" → Use this tool
- "What integrations should I add?" → Use this tool
- "Pick all applicable tags" → Use this tool

⚠️ CRITICAL: Each parameter MUST be passed SEPARATELY. Do NOT combine them!

❌ WRONG (options contains title/description - WILL FAIL):
  options: [{"label": "A"}, {"label": "B"}], "title": "...", "description": "..."

✅ CORRECT (each parameter separate):
  options: [{"label": "A"}, {"label": "B"}]
  title: "Select features"
  description: "Choose all that apply"

PARAMETERS:
- options (REQUIRED): Array of objects, each with "label" (required) and optional "description", "recommended"
- title (optional): String displayed above options
- description (optional): String displayed below title
- min_selections (optional): Minimum selections required
- max_selections (optional): Maximum selections allowed
- allow_other (optional): Boolean to allow custom input

The tool opens a popup in the user's browser and waits for their selections.
If allow_other is true, users can add custom text if predefined options don't fit.
Returns an array of selected options, or indicates if the user skipped.`,
	inputSchema: {
		type: 'object' as const,
		properties: {
			options: {
				type: 'array',
				items: {
					type: 'object',
					properties: {
						label: { type: 'string', description: 'The option text shown to user and returned on selection' },
						description: { type: 'string', description: 'Additional context, pros/cons, code examples, or Markdown-formatted explanation for this option. Displayed below the option label.' },
						recommended: { type: 'boolean', description: 'If true, this option will be visually highlighted as the recommended choice.' }
					},
					required: ['label']
				},
				description: 'List of options for the user to choose from. Each option must have a label property. Use description for additional context (pros/cons, features). The user will see these in a popup and can select multiple.',
				minItems: 2
			},
			allow_other: {
				type: 'boolean',
				description: 'If true, adds an "Other" option that allows the user to enter custom text. The "Other" text will be included in the results array if selected.',
				default: false
			},
			other_label: {
				type: 'string',
				description: 'Custom label for the "Other" option. Only used when allow_other is true.',
				default: 'Other'
			},
			title: {
				type: 'string',
				description: 'Optional title displayed above the selection. Use to provide context or ask a question.'
			},
			description: {
				type: 'string',
				description: 'Optional description text displayed below the title. Use for additional instructions or clarification.'
			}
		},
		required: ['options']
	},
	outputSchema: {
		type: 'object' as const,
		properties: {
			action: {
				type: 'string',
				enum: ['submit', 'skip', 'request_explanation'],
				description: 'Whether the user submitted selections, skipped, or requested an explanation for an option'
			},
			selections: {
				type: 'array',
				items: { type: 'string' },
				description: 'The selected options (only present if action is "submit")'
			},
			comments: {
				type: 'string',
				description: 'Additional comments provided by the user (only present if allow_comments was true and user entered text)'
			},
			explainOption: {
				type: 'string',
				description: 'The option for which explanation was requested (only present if action is "request_explanation")'
			},
			explainMessage: {
				type: 'string',
				description: 'A pre-formatted message asking for explanation (only present if action is "request_explanation")'
			}
		},
		required: ['action']
	}
};

/**
 * Executes the ask_user_multiple tool
 */
export async function executeAskUserMultiple (input: SelectMultipleInput): Promise<SelectMultipleOutput> {
	// Validate input
	if (!input.options || input.options.length < 2) {
		throw new Error('At least 2 options are required');
	}

	// Build form configuration
	const formConfig: FormConfig = {
		title: input.title,
		description: input.description,
		field: {
			type: 'checkbox',
			name: 'selection',
			options: input.options,
			allowOther: input.allow_other,
			otherLabel: (input.other_label ?? 'Other')
		},
		submitLabel: 'Submit',
		skipLabel: 'Skip'
	};

	// Serve the form and wait for response
	const response = await serveFormAndAwaitResponse(formConfig);

	// Transform response to output format
	if (response.action === 'skip') {
		return { action: 'skip' };
	}

	if (response.action === 'request_explanation') {
		const optionLabel = (response.data.explainOption ?? '');

		return {
			action: 'request_explanation',
			explainOption: optionLabel,
			explainMessage: `Could you please explain the option "${optionLabel}" in more detail before I make a decision?`
		};
	}

	const result: SelectMultipleOutput = {
		action: 'submit',
		selections: (response.data.selections ?? [])
	};

	// Include comments if provided
	const comments = response.data.comments;

	if (comments?.trim()) {
		result.comments = comments.trim();
	}

	return result;
}
