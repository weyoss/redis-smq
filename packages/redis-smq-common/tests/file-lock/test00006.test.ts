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

it('should not retry if lock is already held by this process', async () => {
  const lockFile = '/tmp/test-lock';
  const mockFileHandle = { close: vi.fn() };
  const mockOpen = vi.fn().mockResolvedValueOnce(mockFileHandle);
  const mockEnsureDirectoryExists = vi.fn().mockResolvedValue(undefined);

  // Mock dependencies using esmock
  const currentDir = getCurrentDir();
  const { FileLock } = await esmock<
    typeof import('../../src/file-lock/index.js')
  >(
    resolve(currentDir, '../../src/file-lock/index.js'),
    {},
    {
      'node:fs/promises': {
        open: mockOpen,
      },
      [resolve(currentDir, '../../src/env/index.js')]: {
        env: {
          ensureDirectoryExists: mockEnsureDirectoryExists,
        },
      },
    },
  );

  const fileLock = new FileLock();
  await fileLock.acquireLock(lockFile);

  expect(mockOpen).toHaveBeenCalled();
  expect(mockEnsureDirectoryExists).toHaveBeenCalled();

  // Reset mocks to verify they're not called again
  mockOpen.mockClear();
  mockEnsureDirectoryExists.mockClear();

  await fileLock.acquireLock(lockFile);

  expect(mockOpen).not.toHaveBeenCalled();
  expect(mockEnsureDirectoryExists).not.toHaveBeenCalled();
});
