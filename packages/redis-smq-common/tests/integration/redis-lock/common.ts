/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { EventEmitter } from 'node:events';
import { vi } from 'vitest';
import type { ICallback } from '../../../src/async/index.js';
import type { IRedisClient } from '../../../src/redis-client/index.js';

export interface MockTimings {
  /** Delay before `runScript` resolves (ms). */
  runScript?: number;
  /** Delay before `halt` resolves (ms). */
  halt?: number;
  /** Delay before `set` resolves (ms). */
  set?: number;
  /** Delay before `loadScriptFiles` resolves (ms). */
  loadScriptFiles?: number;
}

/**
 * Build a mocked Redis client for `RedisLock` tests that need to interleave
 * a shutdown or error event with an in-flight acquisition / extension.
 *
 * Default timings match what the abort tests rely on:
 *   - `set` and `loadScriptFiles` are slow so an acquire can be interrupted
 *   - `halt` is slower than `runScript` so shutdown doesn't race past extend
 *   - `runScript` is slow enough to observe an abort mid-call
 */
export function getMockedRedisClient(timings: MockTimings = {}): IRedisClient {
  const {
    runScript = 1000,
    halt = 5000,
    set = 10000,
    loadScriptFiles = 5000,
  } = timings;

  const client = new EventEmitter() as unknown as IRedisClient;

  Object.assign(client, {
    runScript: vi.fn(
      (
        _scriptName: string,
        _keys: (string | number)[],
        _args: (string | number)[],
        cb: ICallback<unknown>,
      ) => {
        setTimeout(() => cb(null, 1), runScript);
      },
    ),
    halt: vi.fn((cb: ICallback<void>) => {
      setTimeout(() => cb(), halt);
    }),
    set: vi.fn(
      (
        _key: string,
        _value: string,
        _options: unknown,
        cb: ICallback<string | null>,
      ) => {
        setTimeout(() => cb(null, '1'), set);
      },
    ),
    loadScriptFiles: vi.fn(
      (
        _scriptMap: Record<string, string>,
        cb: ICallback<Record<string, string>>,
      ) => {
        setTimeout(() => cb(null, {}), loadScriptFiles);
      },
    ),
  });

  return client;
}
