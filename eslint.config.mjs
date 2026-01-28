import path from 'node:path';
import { fileURLToPath } from 'node:url';

import javascriptConfig from 'linter-bundle/eslint/javascript.mjs';
import jsdocConfig from 'linter-bundle/eslint/jsdoc.mjs';
import reactConfig from 'linter-bundle/eslint/react.mjs';
import typeDeclarationsConfig from 'linter-bundle/eslint/type-declarations.mjs';
import eslintConfig from 'linter-bundle/eslint.mjs';

export default [
	{
		ignores: ['dist/**']
	},
	...eslintConfig,
	...javascriptConfig,
	...jsdocConfig,
	...reactConfig,
	...typeDeclarationsConfig,
	{
		files: ['**/*.{ts,tsx,js,mjs}'],
		languageOptions: {
			parserOptions: {
				project: null,
				projectService: {
					allowDefaultProject: [
						'*.config.js',
						'*.config.mjs',
						'eslint.config.mjs',
						'scripts/*.mjs',
						'scripts/postcss-plugins/*.mjs'
					],
					defaultProject: 'tsconfig.node.json'
				},
				tsconfigRootDir: path.dirname(fileURLToPath(import.meta.url))
			}
		}
	},
	{
		files: ['*.config.ts', '*.config.js', '*.config.mjs', 'eslint.config.mjs', 'scripts/*.mjs', 'scripts/*/*.mjs', 'scripts/*.js', 'scripts/*/*.js'],
		rules: {
			'import/no-default-export': 'off',
			'import/no-nodejs-modules': 'off',
			'jsdoc/require-file-overview': 'off',
			'n/no-process-exit': 'off'
		}
	},
	{
		files: ['**/tests/**', 'mcp/**/*.ts'],
		rules: {
			'import/no-nodejs-modules': 'off'
		}
	},
	{
		files: ['**/*.{ts,tsx,js,mjs}'],
		rules: {
			'import/dynamic-import-chunkname': 'off',
			'no-await-in-loop': 'off',
			'no-console': 'off',
			'react/no-array-index-key': 'off',
			'@typescript-eslint/naming-convention': 'off',
			'unicorn/prevent-abbreviations': ['error', { ignore: ['args', 'i', 'j', 'res', 'req', /[Rr]ef/u, /[Pp]arams/u, /[Pp]rops/u] }]
		}
	},
	{
		files: ['frontend/**/*.tsx'],
		rules: {
			'@typescript-eslint/promise-function-async': 'off' // False positives with React components, which are assumed to be Server-Side in some cases
		}
	}
];
