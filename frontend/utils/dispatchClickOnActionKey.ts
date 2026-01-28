/**
 * @file Fires a mouse event (`click` or `dblclick`) of a React component, if Enter or Spacebar has been pressed in a keyboard event.
 * @author Jens Duttke <github@duttke.de>
 *
 * This is a helper which covers the required functionality of the ESlint rule jsx-a11y/click-events-have-key-events:
 * > Visible, non-interactive elements with click handlers must have at least one keyboard listener.
 *
 * @see https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/blob/master/docs/rules/click-events-have-key-events.md
 *
 * @example
 * const handleClick = React.useCallback((event: React.MouseEvent<HTMLSpanElement>) => {
 *   // Do something ...
 * }, [])
 *
 * return (
 *   <span role="button" tabIndex={0} onClick={handleClick} onKeyDown={dispatchClickOnActionKey} />
 * );
 */

import { cancelEvent } from './cancelEvent';

export function dispatchClickOnActionKey <T extends HTMLElement | SVGElement> (event: React.KeyboardEvent<T>): void {
	if (isActionKey(event)) {
		cancelEvent(event);

		event.currentTarget.dispatchEvent(new PointerEvent('click', {
			view: window,
			bubbles: true,
			cancelable: true
		}));
	}
}

export function dispatchDblClickOnActionKey <T extends HTMLElement | SVGElement> (event: React.KeyboardEvent<T>): void {
	if (isActionKey(event)) {
		cancelEvent(event);

		event.currentTarget.dispatchEvent(new PointerEvent('dblclick', {
			view: window,
			bubbles: true,
			cancelable: true
		}));
	}
}

function isActionKey <T> (event: React.KeyboardEvent<T>): boolean {
	return (
		event.target instanceof HTMLElement &&
		(event.key === 'Enter' || event.key === ' ') &&
		!(event.ctrlKey || event.metaKey || event.altKey || event.shiftKey)
	);
}
