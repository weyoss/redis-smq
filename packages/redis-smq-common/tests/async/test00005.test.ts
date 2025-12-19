/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, it } from 'vitest';
import { async } from '../../src/async/async.js';

it('async.eachOf: case 1', async () => {
  await new Promise<void>((resolve, reject) => {
    const set = [1, 2, 3, 4];
    let currentIdx = 0;
    async.eachOf(
      [1, 2, 3, 4],
      (item, key, callback) => {
        expect(key).toBe(currentIdx);
        expect(set[key]).toBe(item);
        currentIdx += 1;
        callback();
      },
      (err) => {
        if (err) reject(err);
        else resolve();
      },
    );
  });
});
