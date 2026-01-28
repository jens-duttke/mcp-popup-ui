import * as React from 'react';

import { Button } from '@frontend/components/Button';
import { MarkdownText } from '@frontend/components/MarkdownText';
import { OptionGroup } from '@frontend/components/OptionGroup';
import { Textarea } from '@frontend/components/Textarea';
import type { FormConfig, FormResult } from '@frontend/types';

import * as styles from './styles.module.css';

interface FormProps {
	readonly config: FormConfig;
	readonly onSubmit: (result: FormResult) => void;
	readonly onSkip: () => void;
}

export const Form: React.FunctionComponent<FormProps> = ({ config, onSubmit, onSkip }) => {
	const isMultiple = config.field.type === 'checkbox';

	// Separate state for each mode - only one will be used based on isMultiple
	const [singleValue, setSingleValue] = React.useState('');
	const [multipleValue, setMultipleValue] = React.useState<string[]>([]);
	const [otherText, setOtherText] = React.useState('');
	const [comments, setComments] = React.useState('');

	const isValid = React.useCallback((): boolean => {
		const hasComments = comments.trim().length > 0;

		if (isMultiple) {
			const hasOther = multipleValue.includes('__other__');
			const otherValid = (!hasOther || otherText.trim().length > 0);
			const selectionValid = (multipleValue.length > 0 && otherValid);

			// Valid if selection is made OR if comments are provided
			return (selectionValid || hasComments);
		}

		if (singleValue === '__other__') {
			return otherText.trim().length > 0;
		}

		// Valid if selection is made OR if comments are provided
		return (singleValue.length > 0 || hasComments);
	}, [comments, isMultiple, multipleValue, otherText, singleValue]);

	const handleSubmit = React.useCallback(() => {
		const result: FormResult = {
			action: 'submit'
		};

		if (isMultiple) {
			result.selections = multipleValue.map((item) => (item === '__other__' ? otherText : item));
		}
		else {
			result.selection = (singleValue === '__other__' ? otherText : singleValue);
		}

		// Include comments if provided
		if (comments.trim()) {
			result.comments = comments.trim();
		}

		onSubmit(result);
	}, [comments, isMultiple, multipleValue, onSubmit, otherText, singleValue]);

	const handleSkip = React.useCallback(() => {
		onSkip();
	}, [onSkip]);

	const handleRequestExplanation = React.useCallback((optionLabel: string) => {
		onSubmit({
			action: 'request_explanation',
			explainOption: optionLabel
		});
	}, [onSubmit]);

	const handleMultipleChange = React.useCallback((newValue: string[]) => {
		const wasOther = multipleValue.includes('__other__');
		const isOther = newValue.includes('__other__');

		setMultipleValue(newValue);

		if (!isOther && wasOther) {
			setOtherText('');
		}
	}, [multipleValue]);

	const handleSingleChange = React.useCallback((newValue: string) => {
		setSingleValue(newValue);

		if (newValue !== '__other__') {
			setOtherText('');
		}
	}, []);

	return (
		<div className={styles.container}>
			{((config.title || config.description) && (
				<div className={styles.header}>
					{(config.title && <h1 className={styles.title}><MarkdownText text={config.title} /></h1>)}
					{(config.description && <p className={styles.description}><MarkdownText text={config.description} /></p>)}
				</div>
			))}

			<div className={styles.content}>
				{(isMultiple ? (
					<OptionGroup
						type="checkbox"
						options={config.field.options}
						value={multipleValue}
						allowOther={config.field.allowOther}
						otherLabel={config.field.otherLabel}
						otherText={otherText}
						onChange={handleMultipleChange}
						onOtherTextChange={setOtherText}
						onRequestExplanation={handleRequestExplanation}
					/>
				) : (
					<OptionGroup
						type="radio"
						options={config.field.options}
						value={singleValue}
						allowOther={config.field.allowOther}
						otherLabel={config.field.otherLabel}
						otherText={otherText}
						onChange={handleSingleChange}
						onOtherTextChange={setOtherText}
						onRequestExplanation={handleRequestExplanation}
					/>
				))}
			</div>

			<div className={styles.commentsSection}>
				<Textarea
					placeholder="Additional questions, comments..."
					value={comments}
					rows={3}
					onChange={setComments}
				/>
			</div>

			<div className={styles.buttons}>
				<Button variant="primary" disabled={!isValid()} onClick={handleSubmit}>
					Submit
				</Button>
				<Button variant="secondary" onClick={handleSkip}>
					Skip
				</Button>
			</div>

			<div className={styles.poweredBy}>
				Powered by mcp-popup-ui
			</div>
		</div>
	);
};

Form.displayName = 'Form';
