/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { resolve } from 'path';

export default {
  rootDir: resolve('./'),
  testMatch: ['<rootDir>/dist/esm/tests/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/dist/esm/tests/setup.js'],
  coverageDirectory: '<rootDir>/coverage',
  verbose: true,
  testTimeout: 160000,
  resetMocks: true,
  resetModules: true,
};
