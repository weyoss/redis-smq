/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

const { resolve } = require('path');

module.exports = {
  rootDir: resolve('./'),
  testMatch: ['<rootDir>/dist/cjs/tests/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/dist/cjs/tests/setup.js'],
  coverageDirectory: '<rootDir>/coverage',
  verbose: true,
  testTimeout: 160000,
  resetMocks: true,
  resetModules: true,
};
