export default {
	extends: 'linter-bundle/stylelint.mjs',
	overrides: [
		{
			files: ['**/*.css'],
			rules: {
				'color-no-hex': null
			}
		}
	]
};
