/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import path from 'node:path';
import { type Mock, vi } from 'vitest';
import { env } from '../../../src/env/index.js';

const currentDir = env.getCurrentDir();

export const modPath = path.resolve(
  currentDir,
  '../../../src/redis-server/index.js',
);
export const depPath = path.resolve(currentDir, '../../../src/net/index.js');

export interface ChildProcessMockOptions {
  /** Path that `exec` reports for `which redis-server`. */
  redisBinPath?: string;
  /**
   * Delay (ms) before the fake child process reports "Ready to accept
   * connections" on stdout. Pass `Infinity` to never report readiness —
   * useful for exercising the timeout path.
   */
  startServerTimeout?: number;
}

/**
 * Mock `child_process.spawn` and `child_process.exec` for testing the
 * Redis server lifecycle without actually spawning a process.
 *
 * - `spawn` returns a fake ChildProcess whose `stdout` emits a readiness
 *   message after `startServerTimeout` ms (or never, if `Infinity`).
 * - `exec` synchronously resolves to `{ stdout: redisBinPath }` so the
 *   caller can pick up a binary path without shelling out.
 */
export function mockChildProcess(opts: ChildProcessMockOptions = {}): {
  spawn: Mock;
  exec: Mock;
} {
  const { redisBinPath = '/path/to/redis-server', startServerTimeout = 2000 } =
    opts;

  let closeHandler: (() => void) | null = null;

  const child = {
    stdout: {
      on: vi
        .fn()
        .mockImplementation((_event: string, cb: (data: Buffer) => void) => {
          if (startServerTimeout === Infinity) return;
          setTimeout(
            () => cb(Buffer.from('Ready to accept connections')),
            startServerTimeout,
          );
        }),
      removeListener: vi.fn(),
    },
    stderr: { on: vi.fn() },
    on: vi.fn(),
    once: vi.fn().mockImplementation((event: string, cb: () => void) => {
      if (event === 'close') closeHandler = cb;
    }),
    kill: vi.fn().mockImplementation(() => {
      if (closeHandler) {
        const handler = closeHandler;
        closeHandler = null;
        handler();
      }
    }),
    removeListener: vi.fn(),
  };

  const spawn: Mock = vi.fn().mockReturnValue(child);
  const exec: Mock = vi
    .fn()
    .mockImplementation(
      (
        _cmd: string,
        callback: (
          err: Error | null,
          res: { stdout?: string | Buffer; stderr?: string | Buffer },
        ) => void,
      ) => {
        callback(null, { stdout: redisBinPath });
      },
    );

  return { spawn, exec };
}
