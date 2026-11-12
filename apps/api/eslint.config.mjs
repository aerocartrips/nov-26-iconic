import js from '@eslint/js';
import importPlugin from 'eslint-plugin-import';
import globals from 'globals';

export default [
	{ ignores: ['node_modules/**'] },
	js.configs.recommended,
	{
		files: ['**/*.js'],
		plugins: { import: importPlugin },
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			globals: {
				...globals.node,
			}
		},
		settings: {
			'import/resolver': {
				node: { extensions: ['.js'] },
			},
		},
		rules: {
			...importPlugin.flatConfigs.recommended.rules,
			'no-console': 'off',
			'no-unused-vars': 'off',
			'no-undef': 'error',
			'no-empty': ['error', { allowEmptyCatch: true }],
			'import/no-named-as-default': 'off',
			'import/no-named-as-default-member': 'off',
			'import/no-self-import': 'error',
			'import/no-cycle': 'off',
			'no-restricted-syntax': [
				'error',
				{
					selector: `:matches(CallExpression[callee.property.name=/^(getList|getFullList|getFirstListItem|listRecords|subscribe)$/] > ObjectExpression > Property[key.name='filter'] > .value, CallExpression[callee.property.name='getFirstListItem'] > .arguments:first-child):matches(TemplateLiteral[expressions.length>0], BinaryExpression[operator='+'])`,
					message: 'Do not build a PocketBase filter by interpolating or concatenating values: a request value such as a URL slug can rewrite the filter, and the superuser client bypasses collection rules, so it could read any record in any collection. Bind values as parameters instead: pocketbaseClient.filter(\'slug = {:slug}\', { slug }).',
				},
			],
		},
	},
];
