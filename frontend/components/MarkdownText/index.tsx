import * as React from 'react';

import * as styles from './styles.module.css';

interface MarkdownTextProps {
	/** The text containing markdown formatting */
	readonly text: string;
}

type SegmentType = 'text' | 'bold' | 'italic' | 'strikethrough' | 'code';

interface TextSegment {
	type: SegmentType;
	content: string;
}

interface PatternDefinition {
	pattern: RegExp;
	type: SegmentType;
}

/**
 * Pattern definitions for markdown parsing.
 * Order matters: longer/more specific patterns first.
 */
const PATTERNS: PatternDefinition[] = [
	{ pattern: /\*\*(.+?)\*\*/u, type: 'bold' },
	{ pattern: /__(.+?)__/u, type: 'bold' },
	{ pattern: /~~(.+?)~~/u, type: 'strikethrough' },
	{ pattern: /\*([^*]+)\*/u, type: 'italic' },
	{ pattern: /_([^_]+)_/u, type: 'italic' },
	{ pattern: /`([^`]+)`/u, type: 'code' }
];

interface MatchResult {
	match: RegExpExecArray;
	type: SegmentType;
}

/**
 * Find the earliest match among all patterns
 */
function findEarliestMatch (searchText: string): MatchResult | null {
	let earliest: MatchResult | null = null;

	for (const { pattern, type } of PATTERNS) {
		const match = pattern.exec(searchText);

		if (match !== null && (earliest === null || match.index < earliest.match.index)) {
			earliest = { match, type };
		}
	}

	return earliest;
}

/**
 * Parses markdown text and returns an array of segments with their formatting type.
 * Supports: **bold**, __bold__, *italic*, _italic_, ~~strikethrough~~, and `code`
 */
function parseMarkdown (text: string): TextSegment[] {
	const segments: TextSegment[] = [];
	let currentIndex = 0;

	while (currentIndex < text.length) {
		const searchText = text.slice(currentIndex);
		const result = findEarliestMatch(searchText);

		if (result === null) {
			// No more matches, add remaining text
			segments.push({
				type: 'text',
				content: text.slice(currentIndex)
			});

			break;
		}

		const { match, type } = result;
		const matchStartInOriginal = currentIndex + match.index;

		// Add text before the match
		if (match.index > 0) {
			segments.push({
				type: 'text',
				content: text.slice(currentIndex, matchStartInOriginal)
			});
		}

		// Add the formatted segment (capture group 1 contains the content)
		const content = match[1];

		if (content) {
			segments.push({ type, content });
		}

		// Move past this match
		currentIndex = matchStartInOriginal + match[0].length;
	}

	return segments;
}

/**
 * Renders a text segment with appropriate styling
 */
function renderSegment (segment: TextSegment, index: number): React.ReactNode {
	switch (segment.type) {
		case 'bold':
			return <strong key={index} className={styles.bold}>{segment.content}</strong>;
		case 'italic':
			return <em key={index} className={styles.italic}>{segment.content}</em>;
		case 'strikethrough':
			return <del key={index} className={styles.strikethrough}>{segment.content}</del>;
		case 'code':
			return <code key={index} className={styles.code}>{segment.content}</code>;
		default:
			return <React.Fragment key={index}>{segment.content}</React.Fragment>;
	}
}

/**
 * Component that renders text with basic markdown formatting support.
 * Supports: **bold**, __bold__, *italic*, _italic_, ~~strikethrough~~, and `code`
 */
export const MarkdownText: React.FunctionComponent<MarkdownTextProps> = ({ text }) => {
	const segments = React.useMemo(() => parseMarkdown(text), [text]);

	return (
		<React.Fragment>
			{segments.map((segment, index) => renderSegment(segment, index))}
		</React.Fragment>
	);
};

MarkdownText.displayName = 'MarkdownText';
