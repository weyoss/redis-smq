/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

module.exports = {
  root: true,
  env: {
    node: true,
    es6: true,
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  ignorePatterns: [
    '**/.eslintrc.cjs',
    '**/dist',
    '**/node_modules',
    '**/data',
    '**/api/generated',
    '**/api/model',
  ],
  extends: [
    'eslint:recommended',
    'plugin:json/recommended-legacy',
    'plugin:prettier/recommended',
  ],
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      env: { browser: true, es6: true, node: true },
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:prettier/recommended',
      ],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: 'tsconfig.json',
        sourceType: 'module',
      },
      plugins: ['@typescript-eslint/eslint-plugin'],
    },
    {
      // Vue files in the redis-smq-web-ui directory
      files: ['packages/redis-smq-web-ui/**/*.vue'],
      env: {
        browser: true,
        es6: true,
        node: true,
      },
      extends: [
        'eslint:recommended',
        'plugin:vue/recommended', // Use Vue 3 recommended rules
        'plugin:@typescript-eslint/recommended', // For TypeScript in Vue files
        'plugin:prettier/recommended',
      ],
      parser: 'vue-eslint-parser',
      parserOptions: {
        parser: '@typescript-eslint/parser', // For TypeScript in Vue files
        ecmaVersion: 'latest',
        sourceType: 'module',
        extraFileExtensions: ['.vue'],
      },
      plugins: ['vue', '@typescript-eslint/eslint-plugin'],
    },
    {
      // JavaScript and TypeScript files in the redis-smq-web-ui directory
      files: ['packages/redis-smq-web-ui/**/*.{js,ts}'],
      env: {
        browser: true,
        es6: true,
        node: true,
      },
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:prettier/recommended',
      ],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      plugins: ['@typescript-eslint/eslint-plugin'],
    },
  ],
};
