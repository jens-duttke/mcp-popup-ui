/**
 * Mock submit service for development
 * Logs to console and shows mock feedback
 */

import type { FormResult } from '@frontend/types';

/**
 * Mock submit - logs result
 */
export async function submit (result: FormResult): Promise<void> {
	console.group('🎭 Mock Submit');
	console.log('Action:', result.action);

	if (result.selection) {
		console.log('Selection:', result.selection);
	}

	if (result.selections) {
		console.log('Selections:', result.selections);
	}

	console.log('Full result:', result);
	console.groupEnd();

	return;
}

/**
 * Mock skip - logs and resolves
 */
export async function skip (): Promise<void> {
	console.group('🎭 Mock Skip');
	console.log('User skipped the selection');
	console.groupEnd();

	return;
}
