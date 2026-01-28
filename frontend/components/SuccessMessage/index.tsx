/**
 * Success message shown after form submission or skip
 */

import type * as React from 'react';

import * as styles from './styles.module.css';

export interface SuccessMessageProps {
	readonly action: 'submitted' | 'skipped';
}

export const SuccessMessage: React.FunctionComponent<SuccessMessageProps> = ({ action }) => {
	const title = (action === 'submitted' ?
		'✓ Response submitted'
		: 'Skipped');

	return (
		<div className={styles.container}>
			<div className={styles.card}>
				<h2 className={styles.title}>{title}</h2>
				<p className={styles.subtitle}>This window will close automatically.</p>
			</div>
		</div>
	);
};

SuccessMessage.displayName = 'SuccessMessage';
