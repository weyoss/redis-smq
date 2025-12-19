/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { EventEmitter } from 'events';
import { vitest } from 'vitest';
import { ICallback, TFunction } from '../../src/async/index.js';
import { IRedisClient } from '../../src/redis-client/index.js';

export function getMockedRedisClient() {
  const e = new EventEmitter();
  Object.assign(e, {
    runScript: vitest
      .fn<TFunction>()
      .mockImplementationOnce(
        (
          scriptName: string,
          keys: (string | number)[],
          args: (string | number)[],
          cb: ICallback<unknown>,
        ) => {
          setTimeout(() => cb(null, 1), 1000);
        },
      )
      .mockImplementationOnce(
        (
          scriptName: string,
          keys: (string | number)[],
          args: (string | number)[],
          cb: ICallback<unknown>,
        ) => {
          setTimeout(() => cb(null, 1), 1000);
        },
      ),
    halt: vitest
      .fn<TFunction>()
      .mockImplementationOnce((cb: ICallback<void>) => {
        setTimeout(() => cb(), 5000);
      }),
    set: vitest.fn<TFunction>().mockImplementationOnce(
      (
        key: string,
        value: string,
        options: {
          expire?: { mode: 'EX' | 'PX'; value: number };
          exists?: 'NX' | 'XX';
        },
        cb: ICallback<string | null>,
      ) => {
        setTimeout(() => cb(null, '1'), 10000);
      },
    ),
    loadScriptFiles: vitest
      .fn<TFunction>()
      .mockImplementationOnce(
        (
          scriptMap: Record<string, string>,
          cb: ICallback<Record<string, string>>,
        ): void => {
          setTimeout(() => cb(), 5000);
        },
      ),
  });
  // @ts-expect-error any
  // type-coverage:ignore-next-line
  return e as IRedisClient;
}
