import typescriptEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
  { ignores: ['dist'] },
  {
    files: ['**/*.ts'],
    plugins: { '@typescript-eslint': typescriptEslint },
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 5,
      sourceType: 'module',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      eqeqeq: ['error', 'smart'],
      'linebreak-style': ['error', 'unix'],
      'no-duplicate-imports': 'error',
      'prefer-const': 'warn',
      '@typescript-eslint/no-empty-function': ['error', {
        allow: ['constructors'],
      }],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-this-alias': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
      }],
      '@typescript-eslint/no-unnecessary-condition': 'error',
    },
  },
];
