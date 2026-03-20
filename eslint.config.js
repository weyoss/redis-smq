/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import json from 'eslint-plugin-json';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import vue from 'eslint-plugin-vue';
import globals from 'globals';

export default tseslint.config(
  // Global ignores
  {
    ignores: [
      '**/.eslintrc.cjs',
      '**/dist',
      '**/node_modules',
      '**/data',
      '**/api/generated',
      '**/api/model',
    ],
  },

  // Base configuration for all files
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx,vue}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
  },

  // JavaScript files configuration
  {
    files: ['**/*.{js,mjs,cjs}'],
    ...eslint.configs.recommended,
  },

  // TypeScript files configuration
  ...tseslint.config({
    files: ['**/*.{ts,tsx}'],
    extends: [eslint.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: 'tsconfig.json',
        sourceType: 'module',
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
    },
  }),

  // Vue files configuration
  ...vue.configs['flat/recommended'],
  {
    files: ['packages/redis-smq-web-ui/**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
        ecmaVersion: 'latest',
        sourceType: 'module',
        extraFileExtensions: ['.vue'],
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
    },
  },

  // JavaScript and TypeScript files in redis-smq-web-ui directory
  ...tseslint.config({
    files: ['packages/redis-smq-web-ui/**/*.{js,ts}'],
    extends: [eslint.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
    },
  }),

  // JSON plugin configuration
  {
    files: ['**/*.json'],
    plugins: {
      json,
    },
    rules: {
      ...json.configs['recommended-legacy'].rules,
    },
  },

  // Prettier configuration (should be last to override other rules)
  prettierRecommended,
);
