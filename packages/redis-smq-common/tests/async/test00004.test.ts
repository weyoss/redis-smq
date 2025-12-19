/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { it } from 'vitest';
import { async } from '../../src/async/async.js';

it('async.waterfall: case 4', async () => {
  await new Promise<void>((resolve) => {
    async.waterfall([], () => resolve());
  });
});
