/**
 * Production App that fetches config from server
 * This is the only App loaded in production builds
 */

import * as React from 'react';

import { Form } from './components/Form';
import { SuccessMessage } from './components/SuccessMessage';
import { useFormSubmit } from './hooks/useFormSubmit';
import type { FormConfig } from './types';

/**
 * Type guard to validate FormConfig from API response
 */
function isFormConfig (value: unknown): value is FormConfig {
	if (typeof value !== 'object' || value === null) {
		return false;
	}

	// Check required field property
	if (!('field' in value) || typeof value.field !== 'object' || value.field === null) {
		return false;
	}

	const field = value.field;

	// Check field has required properties
	if (!('type' in field) || !('name' in field) || !('options' in field)) {
		return false;
	}

	if (typeof field.type !== 'string' || !['radio', 'checkbox'].includes(field.type)) {
		return false;
	}

	if (!Array.isArray(field.options)) {
		return false;
	}

	return true;
}

export const App: React.FunctionComponent = () => {
	const [config, setConfig] = React.useState<FormConfig | null>(null);
	const [errorText, setErrorText] = React.useState<string | null>(null);
	const { handleSubmit, handleSkip, submittedAction } = useFormSubmit();

	// Establish SSE connection to let server detect browser close
	React.useEffect(() => {
		const eventSource = new EventSource('/api/connection');

		// Connection is established automatically, no action needed on connect
		// The server will detect when this connection closes (browser window closed)

		return () => {
			eventSource.close();
		};
	}, []);

	React.useEffect(() => {
		fetch('/api/config')
			.then(async (res) => {
				if (!res.ok) { throw new Error(`HTTP ${res.status}`); }

				return res.json() as unknown;
			})
			.then((data) => {
				if (!isFormConfig(data)) {
					throw new Error('Invalid config received from server');
				}

				setConfig(data);
			})
			.catch((error: unknown) => setErrorText(error instanceof Error ? error.message : 'Unknown error'));
	}, []);

	if (submittedAction) {
		return <SuccessMessage action={submittedAction} />;
	}

	if (errorText) {
		return (
			<div style={{
				padding: '32px',
				textAlign: 'center',
				color: '#f48771'
			}}
			>
				Failed to load form configuration: {errorText}
			</div>
		);
	}

	if (!config) {
		return (
			<div style={{
				padding: '32px',
				textAlign: 'center',
				color: '#9d9d9d'
			}}
			>
				Loading...
			</div>
		);
	}

	return (
		<Form
			config={config}
			onSubmit={handleSubmit}
			onSkip={handleSkip}
		/>
	);
};

App.displayName = 'App';
