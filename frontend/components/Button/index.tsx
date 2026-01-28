import * as React from 'react';

import * as styles from './styles.module.css';

interface ButtonProps {
	readonly variant?: 'primary' | 'secondary';
	readonly disabled?: boolean;
	readonly onClick?: () => void;
	readonly children: React.ReactNode;
}

export const Button: React.FunctionComponent<ButtonProps> = ({
	variant = 'primary',
	disabled = false,
	onClick,
	children
}) => (
	<button
		type="button"
		className={`${styles.button} ${styles[variant]}`}
		disabled={disabled}
		onClick={onClick}
	>
		{children}
	</button>
);

Button.displayName = 'Button';
