import * as React from 'react';

import type { NormalizedOption } from '@frontend/types';
import { dispatchClickOnActionKey } from '@frontend/utils/dispatchClickOnActionKey';

import { MarkdownText } from '../MarkdownText';

import * as styles from './styles.module.css';

interface OptionItemProps {
	readonly option: NormalizedOption;
	readonly isRadio: boolean;
	readonly isSelected: boolean;
	readonly onSelect: (label: string) => void;
	readonly onExplain?: (event: React.MouseEvent, label: string) => void;
}

export const OptionItem: React.FunctionComponent<OptionItemProps> = ({
	option,
	isRadio,
	isSelected,
	onSelect,
	onExplain
}) => {
	const id = React.useId();
	const optionValue = (option.value ?? option.label);
	const hasDescription = Boolean(option.description);
	const isRecommended = Boolean(option.recommended);

	const handleSelect = React.useCallback(() => {
		onSelect(optionValue);
	}, [onSelect, optionValue]);

	const handleExplain = React.useCallback((event: React.MouseEvent) => {
		event.stopPropagation();
		onExplain?.(event, optionValue);
	}, [onExplain, optionValue]);

	const optionClasses = [
		styles.option,
		(isSelected ? styles.selected : ''),
		(hasDescription ? styles.hasDescription : ''),
		(isRecommended ? styles.recommended : '')
	].filter(Boolean).join(' ');

	return (
		<div
			role="button"
			tabIndex={0}
			className={optionClasses}
			onClick={handleSelect}
			onKeyDown={dispatchClickOnActionKey}
		>
			<div className={styles.optionMain}>
				<input
					id={id}
					type={(isRadio ? 'radio' : 'checkbox')}
					className={styles.input}
					checked={isSelected}
					name="option"
					onChange={() => { /* Required for controlled input; actual handling via div click */ }}
				/>
				<label htmlFor={id} className={styles.label}>
					<MarkdownText text={option.label} />
					{(isRecommended && <span className={styles.recommendedBadge}>Recommended</span>)}
				</label>
				{(onExplain && (
					<button
						type="button"
						className={styles.explainButton}
						title={`Explain option "${option.label}"`}
						aria-label={`Explain option "${option.label}"`}
						onClick={handleExplain}
					>
						?
					</button>
				))}
			</div>
			{(hasDescription && option.description && (
				<div className={styles.description}><MarkdownText text={option.description} /></div>
			))}
		</div>
	);
};

OptionItem.displayName = 'OptionItem';
