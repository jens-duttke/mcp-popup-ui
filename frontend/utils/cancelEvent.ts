/**
 * @file Helper to stop event propagation and prevent event default functionality.
 * @author Jens Duttke <github@duttke.de>
 */

import type * as React from 'react';

export function cancelEvent (event: Event | React.SyntheticEvent): void {
	// eslint-disable-next-line linter-bundle/no-unnecessary-typeof -- Not all events are cancelable.
	if (typeof event.cancelable !== 'boolean' || event.cancelable) {
		event.preventDefault();
	}

	event.stopPropagation();
}
