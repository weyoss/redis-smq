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

function runEach<C extends unknown[] | Record<string, unknown>>(
  collection: C,
  iteratee: (item: unknown, key: unknown, cb: ICallback<void>) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    async.each(collection as never, iteratee as never, (err) =>
      err ? reject(err) : resolve(),
    );
  });
}

describe('async.each', () => {
  it('visits every element of an array', async () => {
    const visited = new Set<number>();
    await runEach([1, 2, 3, 4], (item, _key, cb) => {
      visited.add(item as number);
      cb();
    });
    expect([...visited].sort()).toEqual([1, 2, 3, 4]);
  });

  it('visits every value of an object', async () => {
    const visited: string[] = [];
    await runEach({ first: 'a', second: 'b', third: 'c' }, (item, _key, cb) => {
      visited.push(item as string);
      cb();
    });
    expect(visited.sort()).toEqual(['a', 'b', 'c']);
  });
});
