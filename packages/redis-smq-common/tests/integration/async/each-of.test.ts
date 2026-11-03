/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import { async } from '../../../src/async/async.js';
import type { ICallback } from '../../../src/async/index.js';

function runEachOf<T>(
  items: T[],
  iteratee: (item: T, key: number, cb: ICallback<void>) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    async.eachOf(items, iteratee, (err) => (err ? reject(err) : resolve()));
  });
}

describe('async.eachOf', () => {
  it('iterates array items in order with matching keys', async () => {
    const items = [1, 2, 3, 4];
    const seen: Array<[number, number]> = [];
    await runEachOf(items, (item, key, cb) => {
      seen.push([item, key]);
      cb();
    });
    expect(seen).toEqual([
      [1, 0],
      [2, 1],
      [3, 2],
      [4, 3],
    ]);
  });

  it('stops on the first error and rejects', async () => {
    await expect(
      runEachOf([1, 2, 3], (_item, _key, cb) =>
        cb(new Error('explicit error')),
      ),
    ).rejects.toThrow('explicit error');
  });

  it('resolves immediately when the collection is empty', async () => {
    await expect(
      runEachOf([], () => {
        throw new Error('unexpected');
      }),
    ).resolves.toBeUndefined();
  });
});
