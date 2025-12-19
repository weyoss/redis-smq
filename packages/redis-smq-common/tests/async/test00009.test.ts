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

it('async.eachIn: case 2', async () => {
  const promise = new Promise<void>((resolve, reject) => {
    const map: Record<string, number> = { first: 1, second: 2, third: 3 };
    async.eachIn(
      map,
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
