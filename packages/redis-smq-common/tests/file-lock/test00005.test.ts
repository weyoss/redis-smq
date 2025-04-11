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

it('should update lock file modification time at regular intervals', async () => {
  const lockFile = '/tmp/test-lock-file';
  const mockFileHandle = { close: vi.fn() };
  const utimesMock = vi.fn().mockResolvedValue(undefined);

  // Mock dependencies using esmock
  const currentDir = getCurrentDir();
  const { FileLock } = await esmock<
    typeof import('../../src/file-lock/index.js')
  >(
    resolve(currentDir, '../../src/file-lock/index.js'),
    {},
    {
      'node:fs/promises': {
        open: vi.fn().mockResolvedValue(mockFileHandle),
        utimes: utimesMock,
      },
      [resolve(currentDir, '../../src/env/index.js')]: {
        env: {
          ensureDirectoryExists: vi.fn().mockResolvedValue(undefined),
        },
      },
    },
  );

  const fileLock = new FileLock();
  await fileLock.acquireLock(lockFile, { updateInterval: 1000 });

  expect(fileLock.isLockHeld(lockFile)).toBe(true);

  await bluebird.delay(5000);

  expect(utimesMock).toHaveBeenCalled();
});
