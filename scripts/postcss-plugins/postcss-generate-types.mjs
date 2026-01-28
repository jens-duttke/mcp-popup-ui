import fs from 'node:fs/promises';

import selectorParser from 'postcss-selector-parser';

/**
 * PostCSS plugin to generate TypeScript declaration files for CSS modules.
 *
 * @param {{ banner?: string; }} options - Plugin options
 * @returns {import('postcss').Plugin} - PostCSS plugin instance
 */
export function generateTypes (options = {}) {
	return {
		postcssPlugin: 'postcss-generate-types',

		async Once (root, { result }) {
			const classNames = new Set();

			root.walkRules((rule) => {
				const parser = selectorParser((selectors) => {
					selectors.walkClasses((classNode) => {
						const className = classNode.value;

						if (!(/^[a-z0-9]+$/gui).test(className)) {
							result.warn(`Selector parse error in "${rule.selector}": Class name "${className}" is not compatible to JavaScript`);
						}
						else {
							classNames.add(className);
						}
					});
				});

				try {
					parser.processSync(rule.selector);
				}
				catch (error) {
					result.warn(`Selector parse error in "${rule.selector}": ${(error instanceof Error ? error.message : 'Unknown error')}`);
				}
			});

			const cssFilePath = root.source?.input.file;

			if (!cssFilePath?.endsWith('.module.css')) { return; }

			const dtsPath = `${cssFilePath}.d.ts`;

			const typeDefs = `${Array.from(classNames)
				.map((className) => `export const ${className}: string;`)
				.join('\n')}\n`;

			await fs.writeFile(dtsPath, (options.banner ? `${options.banner}\n` : '') + typeDefs, { encoding: 'utf8' });
		}
	};
}
