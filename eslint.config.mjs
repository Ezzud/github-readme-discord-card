// eslint.config.mjs


import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import stylisticJs from '@stylistic/eslint-plugin-js';

export default tseslint.config(
    eslint.configs.recommended,
    {
        files: ["**/*.ts","**/*.tsx","**/*.js"],
        plugins: {
            '@typescript-eslint': tseslint.plugin,
            '@stylistic/js': stylisticJs
        },
        languageOptions: {
            parser: tseslint.parser,
        },
        rules: {
            "@typescript-eslint/no-unused-vars": [
                "warn",
                { varsIgnorePattern: "^_", argsIgnorePattern: "^_" },
            ],
            '@stylistic/js/indent': ['error', 4],
            "@stylistic/js/semi": "error"
        }
    },
    ...tseslint.configs.recommended,
    ...tseslint.configs.strict,

);