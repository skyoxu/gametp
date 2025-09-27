import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-plugin-prettier';
import eslintConfigPrettier from 'eslint-config-prettier';

const prettierOptions = {
  semi: true,
  trailingComma: 'es5',
  singleQuote: true,
  printWidth: 80,
  tabWidth: 2,
  useTabs: false,
  bracketSpacing: true,
  arrowParens: 'avoid',
  endOfLine: 'lf',
};

export default tseslint.config([
  {
    ignores: [
      'dist',
      'dist-electron',
      'build',
      'electron-dist',
      'coverage',
      'logs',
      'test-results',
      'node_modules',
      'docs',
      '__snapshots__',
      '**/*.d.ts',
      'src/shared/contracts/**',
    ],
  },
  {
    files: ['**/*.{js,ts,tsx,mjs,cjs}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      eslintConfigPrettier,
    ],
    languageOptions: {
      parser: tseslint.parser,
      ecmaVersion: 2020,
      globals: { ...globals.node, ...globals.es2020 },
    },
    plugins: { prettier },
    rules: {
      'prettier/prettier': ['error', prettierOptions],
      'no-empty': 'warn',
      'no-case-declarations': 'warn',
      'no-empty-pattern': 'warn',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'warn',
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-unnecessary-type-constraint': 'warn',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      'no-console': 'off',
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
      eslintConfigPrettier,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: { ...globals.browser, ...globals.node, ...globals.es2020 },
    },
    plugins: { prettier, react },
    settings: { react: { version: 'detect' } },
    rules: {
      'prettier/prettier': ['error', prettierOptions],
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      'react-hooks/rules-of-hooks': 'warn',
      'react-hooks/exhaustive-deps': 'off',
      'no-empty': 'warn',
      'no-case-declarations': 'warn',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'warn',
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-unnecessary-type-constraint': 'warn',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  },
  {
    files: ['tests/**/*.{ts,tsx,js,mjs}'],
    extends: [tseslint.configs.recommended, eslintConfigPrettier],
    languageOptions: {
      parser: tseslint.parser,
      ecmaVersion: 2020,
      globals: { ...globals.node },
    },
    plugins: { prettier },
    rules: {
      'prettier/prettier': ['error', prettierOptions],
      'no-empty-pattern': 'warn',
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
]);
