/**
 * Production submit service
 * POSTs form results to the MCP server
 */

import type { FormResult } from '@frontend/types';

/**
 * Submit form result to the MCP server
 */
export async function submit (result: FormResult): Promise<void> {
	const response = await fetch('/api/submit', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ action: result.action, data: result })
	});

	if (!response.ok) {
		throw new Error(`HTTP ${response.status}`);
	}
}

/**
 * Skip handler - convenience wrapper
 */
export async function skip (): Promise<void> {
	await submit({ action: 'skip' });
}
