/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
const { resolve } = require('path');

module.exports = {
  rootDir: resolve('./'),
  testMatch: ['**/dist/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/dist/tests/jest.setup.js'],
  coverageDirectory: '<rootDir>/coverage',
};
