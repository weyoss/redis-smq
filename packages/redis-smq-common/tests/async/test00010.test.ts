/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, it } from 'vitest';
import { async } from '../../src/async/async.js';

it('async.eachIn: case 3', async () => {
  const promise = new Promise<string>((resolve, reject) => {
    const map: Record<string, number> = {};
    async.eachIn(
      map,
      (item, key, callback) => {
        callback(new Error('unexpected call'));
      },
      (err) => {
        if (err) reject(err);
        else resolve('OK');
      },
    );
  });
  await expect(promise).resolves.toBe('OK');
});
