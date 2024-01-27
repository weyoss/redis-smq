/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { startUp } from './common/start-up';
import { shutdown } from './common/shut-down';

beforeAll(() => void 0);

afterAll(() => void 0);

beforeEach(async () => {
  await startUp();
  jest.resetModules();
});

afterEach(async () => {
  await shutdown();
});

jest.setTimeout(160000);
