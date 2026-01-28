import * as React from 'react';

import { OptionItem } from '@frontend/components/OptionItem';
import { Textarea } from '@frontend/components/Textarea';
import type { NormalizedOption, Option } from '@frontend/types';

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

				return (
					<OptionItem
						key={index}
						option={normalized}
						isRadio={isRadio}
						isSelected={isSelected}
						onSelect={handleOptionClick}
						onExplain={handleExplainClick}
					/>
				);
			})}

			{(allowOther && (
				<React.Fragment>
					<OptionItem
						option={{ label: otherLabel, value: '__other__' }}
						isRadio={isRadio}
						isSelected={isOtherSelected}
						onSelect={handleOptionClick}
					/>
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
