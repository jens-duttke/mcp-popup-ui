/**
 * Development App with sample forms and form selector
 * Only loaded when running `npm run dev`
 */

import * as React from 'react';

import { Form } from './components/Form';
import { SuccessMessage } from './components/SuccessMessage';
import { useFormSubmit } from './hooks/useFormSubmit';
import type { FormConfig } from './types';

/**
 * Sample form configurations for development testing
 */
const SAMPLE_FORMS: Record<string, FormConfig> = {
	single: {
		title: 'Choose your favorite color',
		description: 'Please select the color you prefer most.',
		field: {
			type: 'radio',
			name: 'selection',
			options: ['Red', 'Green', 'Blue', 'Yellow'],
			allowOther: true,
			otherLabel: 'Custom color'
		}
	},
	singleWithDescriptions: {
		title: 'React Frontend Implementation',
		description: 'Choose your preferred approach for building the **React + CSS Modules** frontend.',
		field: {
			type: 'radio',
			name: 'selection',
			options: [
				{ label: 'Vite', description: '**Fast**, modern, zero-config CSS Modules support.\nHMR, ESBuild for dev, Rollup for prod.\n~50MB dev deps.', recommended: true },
				{ label: 'esbuild', description: '*Ultra-fast* builds, tiny footprint.\nManual CSS Modules setup via plugin.\n~5MB dev deps.' },
				{ label: 'Parcel', description: 'Zero-config, ~~complicated~~ automatic CSS Modules detection.\nGood DX, slightly slower than Vite.\n~100MB dev deps.' },
				{ label: 'Webpack', description: 'Battle-tested, maximum flexibility.\nMore config required via `webpack.config.js`, large ecosystem.\n~150MB dev deps.' }
			]
		}
	},
	multiple: {
		title: 'Select your programming languages',
		description: 'Choose all languages you are proficient in.',
		field: {
			type: 'checkbox',
			name: 'selection',
			options: ['JavaScript', 'TypeScript', 'Python', 'Rust', 'Go'],
			allowOther: true,
			otherLabel: 'Other language'
		}
	},
	multipleWithDescriptions: {
		title: 'Select features to include',
		description: 'Choose which features you want in your project.',
		field: {
			type: 'checkbox',
			name: 'selection',
			options: [
				{ label: 'TypeScript', description: 'Static type checking for better DX' },
				{ label: 'ESLint', description: 'Code linting and style enforcement' },
				{ label: 'Prettier', description: 'Automatic code formatting' },
				{ label: 'Testing', description: 'Unit and integration tests with Vitest' },
				{ label: 'CI/CD', description: 'GitHub Actions workflow' }
			]
		}
	}
};

type FormKey = keyof typeof SAMPLE_FORMS;

export const App: React.FunctionComponent = () => {
	const [activeForm, setActiveForm] = React.useState<FormKey>('singleWithDescriptions');
	const { handleSubmit, handleSkip, submittedAction } = useFormSubmit();

	if (submittedAction) {
		return (
			<div style={{ width: '100%' }}>
				<SuccessMessage action={submittedAction} />

				<div style={{ textAlign: 'center', marginTop: '16px' }}>
					<button
						type="button"
						style={{
							padding: '8px 16px',
							border: '1px solid #3c3c3c',
							background: '#252526',
							color: '#9d9d9d',
							cursor: 'pointer',
							fontSize: '13px',
							fontFamily: 'inherit'
						}}
						onClick={() => window.location.reload()}
					>
						Test Again
					</button>
				</div>
			</div>
		);
	}

	return (
		<div style={{ width: '100%' }}>
			{/* Dev mode indicator */}
			<div style={{
				background: '#252526',
				color: '#9d9d9d',
				padding: '6px 12px',
				marginBottom: '12px',
				textAlign: 'center',
				fontSize: '12px',
				borderBottom: '1px solid #3c3c3c'
			}}
			>
				<span style={{ color: '#3794ff' }}>⚡</span> Development Mode — Submissions logged to console
			</div>

			{/* Form selector tabs */}
			<div style={{
				background: '#252526',
				borderBottom: '1px solid #3c3c3c',
				marginBottom: '0',
				display: 'flex',
				gap: '0',
				flexWrap: 'wrap'
			}}
			>
				{Object.keys(SAMPLE_FORMS).map((key) => (
					<button
						key={key}
						type="button"
						style={{
							padding: '8px 16px',
							border: 'none',
							borderBottom: (activeForm === key ? '2px solid #007acc' : '2px solid transparent'),
							background: (activeForm === key ? '#1e1e1e' : 'transparent'),
							color: (activeForm === key ? '#ffffff' : '#9d9d9d'),
							cursor: 'pointer',
							fontSize: '13px',
							fontFamily: 'inherit',
							transition: 'all 0.1s ease'
						}}
						onClick={() => setActiveForm(key)}
					>
						{key}
					</button>
				))}
			</div>

			{/* Active form */}
			<Form
				key={activeForm}
				config={SAMPLE_FORMS[activeForm]}
				onSubmit={handleSubmit}
				onSkip={handleSkip}
			/>
		</div>
	);
};

App.displayName = 'App';
