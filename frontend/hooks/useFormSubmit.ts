/**
 * Hook for handling form submission
 * Uses build-time alias to swap mock/production implementation
 */

import * as React from 'react';

import { submit, skip } from '@frontend/services/submit';
import type { FormResult } from '@frontend/types';

/** Time in ms before auto-closing the window after successful submit */
const AUTO_CLOSE_DELAY = 3000;

interface UseFormSubmitResult {
	handleSubmit: (result: FormResult) => void;
	handleSkip: () => void;
	submittedAction: 'submitted' | 'skipped' | null;
}

/**
 * Closes the window after a delay.
 * Uses window.close() which works in app-mode browsers.
 */
function scheduleWindowClose (): void {
	setTimeout(() => {
		window.close();
	}, AUTO_CLOSE_DELAY);
}

export function useFormSubmit (): UseFormSubmitResult {
	const [submittedAction, setSubmittedAction] = React.useState<'submitted' | 'skipped' | null>(null);

	const handleSubmit = React.useCallback((result: FormResult) => {
		void submit(result).then(() => {
			setSubmittedAction('submitted');
			scheduleWindowClose();
		});
	}, []);

	const handleSkip = React.useCallback(() => {
		void skip().then(() => {
			setSubmittedAction('skipped');
			scheduleWindowClose();
		});
	}, []);

	return { handleSubmit, handleSkip, submittedAction };
}
