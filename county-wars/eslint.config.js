import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  // Base ESLint recommended rules
  js.configs.recommended,

  // TypeScript and React files
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    plugins: {
      '@typescript-eslint': typescript,
      'react': react,
      'react-hooks': reactHooks,
    },
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        // Jest globals
        'describe': 'readonly',
        'it': 'readonly',
        'test': 'readonly',
        'expect': 'readonly',
        'beforeAll': 'readonly',
        'beforeEach': 'readonly',
        'afterAll': 'readonly',
        'afterEach': 'readonly',
        'jest': 'readonly',
        // React globals
        'React': 'readonly',
        // Node.js globals
        'process': 'readonly',
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        console: 'readonly',
        'alert': 'readonly',
        // Timer functions
        'setInterval': 'readonly',
        'clearInterval': 'readonly',
        'setTimeout': 'readonly',
        'clearTimeout': 'readonly',
        // Add other browser APIs you might use
        fetch: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
      },
    },
    rules: {
      // TypeScript rules
      ...typescript.configs.recommended.rules,

      // React rules
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,

      // Custom overrides
      'react/react-in-jsx-scope': 'off', // Not needed in React 17+
      'react/prop-types': 'off', // Using TypeScript for prop validation
      'max-len': ['error', { code: 110 }], // Enforce maximum line length of 110 characters
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },

  // Ignore patterns
  {
    ignores: ['dist/**', 'build/**', 'node_modules/**'],
  },
];
