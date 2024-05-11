/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  jest,
} from '@jest/globals';
import { shutdown } from './common/shut-down.js';
import { startUp } from './common/start-up.js';

beforeAll(() => void 0);

afterAll(() => void 0);

beforeEach(async () => {
  jest.resetAllMocks();
  jest.resetModules();
  await startUp();
  jest.resetModules();
});

afterEach(async () => {
  await shutdown();
});
