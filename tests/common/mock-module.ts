/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { jest } from '@jest/globals';
import { TFunction } from 'redis-smq-common';

export function mockModule(moduleName: string, mockFactory: TFunction) {
  if (process.env['NODE_OPTIONS']?.includes('--experimental-vm-modules')) {
    jest.unstable_mockModule(moduleName, mockFactory);
  } else {
    // Fixing TypeError: The second argument of `jest.mock` must be an inline function.
    jest.mock(moduleName, (...args: unknown[]) => mockFactory(...args));
  }
}
