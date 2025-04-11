/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import bluebird from 'bluebird';
import esmock from 'esmock';
import { resolve } from 'path';
import { expect, it, vi } from 'vitest';
import { getCurrentDir } from '../../src/env/current-dir.js';

it('should attempt to clean up all locks on process exit', async () => {
  const lockFile1 = '/tmp/test-lock-file-1';
  const lockFile2 = '/tmp/test-lock-file-2';
  const mockFileHandle1 = { close: vi.fn() };
  const mockFileHandle2 = { close: vi.fn() };
  const unlinkMock = vi.fn().mockResolvedValue(undefined);

  // Capture the exit handler
  let exitHandler: () => void = () => void 0;
  const mockOnce = vi
    .fn()
    .mockImplementation((event: string, handler: () => void) => {
      if (event === 'exit') {
        exitHandler = handler;
      }
      return process;
    });

  // Create open mock that returns different file handles
  const openMock = vi
    .fn()
    .mockResolvedValueOnce(mockFileHandle1)
    .mockResolvedValueOnce(mockFileHandle2);

  // Mock dependencies using esmock
  const currentDir = getCurrentDir();
  const { FileLock } = await esmock<
    typeof import('../../src/file-lock/index.js')
  >(
    resolve(currentDir, '../../src/file-lock/index.js'),
    {},
    {
      'node:fs/promises': {
        open: openMock,
        unlink: unlinkMock,
      },
      [resolve(currentDir, '../../src/env/index.js')]: {
        env: {
          ensureDirectoryExists: vi.fn().mockResolvedValue(undefined),
        },
      },
      import: {
        process: {
          once: mockOnce,
        },
      },
    },
  );

  const fileLock = new FileLock();

  // Acquire two locks
  await fileLock.acquireLock(lockFile1);
  await fileLock.acquireLock(lockFile2);

  expect(fileLock.isLockHeld(lockFile1)).toBe(true);
  expect(fileLock.isLockHeld(lockFile2)).toBe(true);

  // Simulate process exit
  if (exitHandler) {
    exitHandler();
  }

  await bluebird.delay(5000);

  // Verify cleanup
  expect(mockFileHandle1.close).toHaveBeenCalled();
  expect(mockFileHandle2.close).toHaveBeenCalled();
  expect(unlinkMock).toHaveBeenCalledWith(lockFile1);
  expect(unlinkMock).toHaveBeenCalledWith(lockFile2);
});
