import * as React from 'react';

import * as styles from './styles.module.css';

interface TextareaProps {
	readonly value: string;
	readonly placeholder?: string;
	readonly rows?: number;
	readonly disabled?: boolean;
	readonly compact?: boolean;
	readonly onChange: (value: string) => void;
}

export const Textarea: React.FunctionComponent<TextareaProps> = ({
	value,
	placeholder,
	rows = 3,
	disabled = false,
	compact = false,
	onChange
}) => {
	const handleChange = React.useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
		onChange(event.target.value);
	}, [onChange]);

	const className = [styles.textarea, (compact ? styles.compact : '')].filter(Boolean).join(' ');

	return (
		<textarea
			className={className}
			placeholder={placeholder}
			value={value}
			rows={rows}
			disabled={disabled}
			onChange={handleChange}
		/>
	);
};

Textarea.displayName = 'Textarea';
