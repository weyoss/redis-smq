/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import path, { dirname } from 'node:path';
import { vi } from 'vitest';

const currentDir = getDirname();

export const modPath = path.resolve(
  currentDir,
  '../../src/redis-server/index.js',
);
export const depPath = path.resolve(currentDir, '../../src/net/index.js');

function isStackTraces(stack: unknown): stack is NodeJS.CallSite[] {
  return !!(stack && Array.isArray(stack));
}

function getDirname(): string {
  const prepareStackTrace = Error.prepareStackTrace;
  Error.prepareStackTrace = (
    err: Error,
    stackTraces: NodeJS.CallSite[],
  ): NodeJS.CallSite[] => {
    return stackTraces;
  };
  const err = new Error();
  const stack: unknown = err.stack;
  Error.prepareStackTrace = prepareStackTrace;
  if (isStackTraces(stack)) {
    const filename = stack[1].getFileName();
    if (filename) {
      const cleanFilename = filename.startsWith('file://')
        ? filename.substring(7)
        : filename;
      return dirname(cleanFilename);
    }
  }
  throw new Error(`Could not get current dir`);
}

export function mockChildProcess(
  args: { redisBinPath?: string; startServerTimeout?: number } = {},
) {
  let closeHandler: (() => void) | null = null;
  const process = {
    stdout: {
      on: vi
        .fn()
        .mockImplementation((key: string, cb: (data: Buffer) => void) => {
          setTimeout(
            () => cb(Buffer.from('Ready to accept connections')),
            args.startServerTimeout ?? 2000,
          );
        }),
      removeListener: vi.fn(),
    },
    stderr: {
      on: vi.fn(),
    },
    on: vi.fn(),
    once: vi.fn().mockImplementation((event: string, cb: () => void) => {
      if (event === 'close') {
        closeHandler = cb;
      }
    }),
    kill: vi.fn().mockImplementation(() => {
      if (closeHandler) closeHandler();
    }),
    removeListener: vi.fn(),
  };

  return {
    spawn: vi.fn().mockReturnValue(process),
    exec: vi
      .fn()
      .mockImplementation(
        (
          command: string,
          callback: (
            error: Error | null,
            res: { stdout?: string | Buffer; stderr?: string | Buffer },
          ) => void,
        ) => {
          callback(null, {
            stdout: args.redisBinPath ?? '/path/to/redis-server',
          });
        },
      ),
  };
}
