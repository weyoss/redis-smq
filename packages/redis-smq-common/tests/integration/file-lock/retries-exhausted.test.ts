/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, it, vi } from 'vitest';
import os from 'node:os';
import { resolve } from 'node:path';
import { AttemptsExhaustedError } from '../../../src/file-lock/errors/index.js';
import { loadMockedFileLock } from './common.js';

it('rejects with AttemptsExhaustedError after all retries fail', async () => {
  const lockFile = resolve(os.tmpdir(), `${Date.now()}.lock`);

  // `setTimeout` mocked to fire immediately, so retries don't actually wait.
  const setTimeoutMock = vi.fn().mockImplementation((cb: () => void) => {
    cb();
    return {};
  });

  const { FileLock } = await loadMockedFileLock(
    {
      open: vi
        .fn()
        .mockRejectedValue(Object.assign(new Error(), { code: 'EEXIST' })),
      // Fresh mtime → lock is not stale → retry, don't steal.
      stat: vi.fn().mockResolvedValue({ mtime: new Date() }),
    },
    { extraMocks: { import: { setTimeout: setTimeoutMock } } },
  );

  const fileLock = new FileLock();

  await expect(fileLock.acquireLock(lockFile, { retries: 3 })).rejects.toThrow(
    new AttemptsExhaustedError({ metadata: { lockFile, retries: 3 } }).message,
  );

  expect(fileLock.isLockHeld(lockFile)).toBe(false);
  expect(setTimeoutMock).toHaveBeenCalled();
});
