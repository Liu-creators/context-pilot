import tseslint from 'typescript-eslint';
import obsidianmd from "eslint-plugin-obsidianmd";
import globals from "globals";
import { globalIgnores } from "eslint/config";

export default tseslint.config(
	{
		languageOptions: {
			globals: {
				...globals.browser,
			},
			parserOptions: {
				projectService: {
					allowDefaultProject: [
						'eslint.config.js',
						'manifest.json'
					]
				},
				tsconfigRootDir: import.meta.dirname,
				extraFileExtensions: ['.json']
			},
		},
	},
	...obsidianmd.configs.recommended,
	{
		files: ["**/*.ts", "**/*.tsx"],
		plugins: {
			obsidianmd,
			'@typescript-eslint': tseslint.plugin
		},
		rules: {
			'no-console': 'warn',
			'obsidianmd/no-static-styles-assignment': 'warn',
			'obsidianmd/no-forbidden-elements': 'warn',
			'obsidianmd/ui/sentence-case': 'warn',
			'@typescript-eslint/no-unsafe-assignment': 'warn',
			'@typescript-eslint/no-unsafe-call': 'warn',
			'@typescript-eslint/no-unsafe-member-access': 'warn',
			'@typescript-eslint/no-unsafe-argument': 'warn',
			'@typescript-eslint/no-unsafe-return': 'warn',
			'@typescript-eslint/no-this-alias': 'warn',
			'@typescript-eslint/no-floating-promises': 'warn',
			'@typescript-eslint/no-misused-promises': 'warn',
			'@typescript-eslint/no-deprecated': 'warn',
			'@typescript-eslint/only-throw-error': 'warn',
			'no-restricted-globals': 'warn',
			'obsidianmd/platform': 'warn',
			'obsidianmd/sample-names': 'warn',
			'@microsoft/sdl/no-inner-html': 'warn',
		}
	},
	globalIgnores([
		"node_modules",
		"dist",
		"esbuild.config.mjs",
		"eslint.config.js",
		"version-bump.mjs",
		"versions.json",
		"main.js",
		"coverage",
		"jest.config.js",
		"__tests__",
		"__mocks__"
	]),
);
