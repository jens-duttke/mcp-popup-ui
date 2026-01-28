import * as React from 'react';

import { MarkdownText } from '@frontend/components/MarkdownText';
import { Textarea } from '@frontend/components/Textarea';
import type { NormalizedOption, Option } from '@frontend/types';
import { dispatchClickOnActionKey } from '@frontend/utils/dispatchClickOnActionKey';

import * as styles from './styles.module.css';

interface OptionGroupPropsRadio {
	readonly type: 'radio';
	readonly value: string;
	readonly onChange: (value: string) => void;
}

interface OptionGroupPropsCheckbox {
	readonly type: 'checkbox';
	readonly value: string[];
	readonly onChange: (value: string[]) => void;
}

interface OptionGroupPropsBase {
	readonly options: Option[];
	readonly allowOther: boolean | undefined;
	readonly otherLabel: string | undefined;
	readonly otherText: string;
	readonly onRequestExplanation: (optionLabel: string) => void;
	readonly onOtherTextChange: (text: string) => void;
}

type OptionGroupProps = (OptionGroupPropsRadio | OptionGroupPropsCheckbox) & OptionGroupPropsBase;

function normalizeOption (option: Option): NormalizedOption {
	if (typeof option === 'string') {
		return { label: option };
	}

	return option;
}

export const OptionGroup: React.FunctionComponent<OptionGroupProps> = ({
	type,
	options,
	value,
	allowOther = false,
	otherLabel = 'Other',
	otherText = '',
	onChange,
	onRequestExplanation,
	onOtherTextChange
}) => {
	const isRadio = type === 'radio';

	const selectedValues = React.useMemo(() => {
		if (isRadio) {
			if (value) {
				return [value];
			}

			return [];
		}

		return (value);
	}, [isRadio, value]);

	const isOtherSelected = selectedValues.includes('__other__');

	const handleOptionClick = React.useCallback((optionLabel: string) => {
		if (isRadio) {
			onChange(optionLabel);
		}
		else {
			const current = value;

			if (current.includes(optionLabel)) {
				onChange(current.filter((item) => item !== optionLabel));
			}
			else {
				onChange([...current, optionLabel]);
			}
		}
	}, [isRadio, onChange, value]);

	const handleExplainClick = React.useCallback((event: React.MouseEvent, optionLabel: string) => {
		event.stopPropagation();
		onRequestExplanation(optionLabel);
	}, [onRequestExplanation]);

	return (
		<div className={styles.options}>
			{options.map((option, index) => {
				const normalized = normalizeOption(option);
				const isSelected = selectedValues.includes(normalized.label);
				const hasDescription = Boolean(normalized.description);
				const isRecommended = Boolean(normalized.recommended);

				const optionClasses = [
					styles.option, (
          isSelected ? styles.selected : ''), (
          hasDescription ? styles.hasDescription : ''), (
          isRecommended ? styles.recommended : '')
				].filter(Boolean).join(' ');

				return (
					<div
						key={index}
						role="button"
						tabIndex={0}
						className={optionClasses}
						onClick={() => handleOptionClick(normalized.label)}
						onKeyDown={dispatchClickOnActionKey}
					>
						<div className={styles.optionMain}>
							<input
								type={(isRadio ? 'radio' : 'checkbox')}
								className={styles.input}
								checked={isSelected}
								name="option"
								onChange={() => { /* Required for controlled input; actual handling via div click */ }}
							/>
							<label className={styles.label}>
								<MarkdownText text={normalized.label} />
								{(isRecommended && <span className={styles.recommendedBadge}>Recommended</span>)}
							</label>
							<button
								type="button"
								className={styles.explainButton}
								title={`Explain option "${normalized.label}"`}
								aria-label={`Explain option "${normalized.label}"`}
								onClick={(event) => handleExplainClick(event, normalized.label)}
							>
								?
							</button>
						</div>
						{(hasDescription && normalized.description && (
							<div className={styles.description}><MarkdownText text={normalized.description} /></div>
						))}
					</div>
				);
			})}

			{(allowOther && (
				<React.Fragment>
					<div
						role="button"
						tabIndex={0}
						className={`${styles.option} ${(isOtherSelected ? styles.selected : '')}`}
						onClick={() => handleOptionClick('__other__')}
						onKeyDown={dispatchClickOnActionKey}
					>
						<div className={styles.optionMain}>
							<input
								type={(isRadio ? 'radio' : 'checkbox')}
								className={styles.input}
								checked={isOtherSelected}
								name="option"
								onChange={() => { /* Required for controlled input; actual handling via div click */ }}
							/>
							<label className={styles.label}><MarkdownText text={otherLabel} /></label>
						</div>
					</div>
					{(isOtherSelected && (
						<div className={styles.otherContainer}>
							<Textarea
								placeholder="Please specify..."
								value={otherText}
								rows={1}
								compact={true}
								onChange={onOtherTextChange}
							/>
						</div>
					))}
				</React.Fragment>
			))}
		</div>
	);
};

OptionGroup.displayName = 'OptionGroup';
