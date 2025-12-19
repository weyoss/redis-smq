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

it('async.eachOf: case 2', async () => {
  const promise = new Promise<void>((resolve, reject) => {
    async.eachOf(
      [1, 2, 3, 4],
      (item, key, callback) => {
        callback(new Error('explicit error'));
      },
      (err) => {
        if (err) reject(err);
        else resolve();
      },
    );
  });
  await expect(promise).rejects.toThrow('explicit error');
});
