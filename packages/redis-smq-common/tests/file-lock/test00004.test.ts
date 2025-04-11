/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import esmock from 'esmock';
import { resolve } from 'path';
import { expect, it, vi } from 'vitest';
import { getCurrentDir } from '../../src/env/current-dir.js';
import { FileLockAttemptsExhaustedError } from '../../src/file-lock/errors/index.js';

it('should throw error when maximum retry attempts are exhausted', async () => {
  const lockFile = '/tmp/test-lock-file';

  // Mock setTimeout to execute immediately
  const mockSetTimeout = vi.fn().mockImplementation((cb: () => void) => {
    cb();
    return {};
  });

  // Mock dependencies using esmock
  const currentDir = getCurrentDir();
  const { FileLock } = await esmock<
    typeof import('../../src/file-lock/index.js')
  >(
    resolve(currentDir, '../../src/file-lock/index.js'),
    {},
    {
      'node:fs/promises': {
        open: vi
          .fn()
          .mockRejectedValue(Object.assign(new Error(), { code: 'EEXIST' })),
        stat: vi.fn().mockResolvedValue({
          mtime: new Date(),
        }),
      },
      [resolve(currentDir, '../../src/env/index.js')]: {
        env: {
          ensureDirectoryExists: vi.fn().mockResolvedValue(undefined),
        },
      },
      import: {
        setTimeout: mockSetTimeout,
      },
    },
  );

  const fileLock = new FileLock();

  await expect(fileLock.acquireLock(lockFile, { retries: 3 })).rejects.toThrow(
    new FileLockAttemptsExhaustedError(lockFile, 3).message,
  );

  expect(fileLock.isLockHeld(lockFile)).toBe(false);
});
