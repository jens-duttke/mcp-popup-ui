/**
 * ask_user tool implementation
 * Displays radio buttons for single option selection
 */

import { serveFormAndAwaitResponse } from '../http/index.js';
import type {
	SelectSingleInput,
	SelectSingleOutput,
	FormConfig
} from '../types/index.js';

/**
 * Tool definition for MCP registration
 */
export const askUserDefinition = {
	name: 'ask_user',
	description: `Ask the user to choose exactly ONE option from a list. Use this tool instead of listing options in your text response whenever you need the user to make a decision.

WHEN TO USE THIS TOOL:
- You are about to list numbered options and ask "which do you prefer?"
- You need user confirmation on a specific choice before proceeding
- The user must pick one mutually exclusive option (e.g., "Which approach should I implement?", "Which file should I modify?", "What framework do you want?")

EXAMPLES OF WHEN TO USE:
- "Should I use Option A, B, or C?" → Use this tool
- "Which implementation approach?" → Use this tool
- "What programming language?" → Use this tool
- "Pick a template to scaffold" → Use this tool

⚠️ CRITICAL: Each parameter MUST be passed SEPARATELY. Do NOT combine them!

❌ WRONG (options contains title/description - WILL FAIL):
  options: [{"label": "A"}, {"label": "B"}], "title": "...", "description": "..."

✅ CORRECT (each parameter separate):
  options: [{"label": "A"}, {"label": "B"}]
  title: "Pick one"
  description: "Choose your preference"

PARAMETERS:
- options (REQUIRED): Array of objects, each with "label" (required) and optional "description", "recommended"
- title (optional): String displayed above options
- description (optional): String displayed below title
- allow_other (optional): Boolean to allow custom input

The tool opens a popup in the user's browser and waits for their selection.
If allow_other is true, users can enter custom text if predefined options don't fit.
Returns the selected option as a string, or indicates if the user skipped.`,
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
				description: 'List of options for the user to choose from. Each option must have a label property. Use description for additional context (pros/cons, code examples). The user will see these in a popup and select one.',
				minItems: 2
			},
			allow_other: {
				type: 'boolean',
				description: 'If true, adds an "Other" option that allows the user to enter custom text. Use when the predefined options might not cover all possibilities.',
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
				description: 'Whether the user submitted a selection, skipped, or requested an explanation for an option'
			},
			selection: {
				type: 'string',
				description: 'The selected option (only present if action is "submit")'
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
 * Executes the ask_user tool
 */
export async function executeAskUser (input: SelectSingleInput): Promise<SelectSingleOutput> {
	// Validate input
	if (!input.options || input.options.length < 2) {
		throw new Error('At least 2 options are required');
	}

	// Build form configuration
	const formConfig: FormConfig = {
		title: input.title,
		description: input.description,
		field: {
			type: 'radio',
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

	const result: SelectSingleOutput = {
		action: 'submit',
		selection: (response.data.selection ?? '')
	};

	// Include comments if provided
	const comments = response.data.comments;

	if (comments?.trim()) {
		result.comments = comments.trim();
	}

	return result;
}
