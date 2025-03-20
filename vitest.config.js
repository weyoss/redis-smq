/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    deps: {
      moduleDirectories: ['packages'],
    },
    setupFiles: './tests/setup.js',
    testTimeout: 240000,
    environment: 'node',
    watch: false,
    cache: false,
    coverage: {
      enabled: true,
      reportsDirectory: '../../coverage',
    },
    onConsoleLog() {
      return true;
    },
    onStackTrace() {
      return true;
    },
  },
});
