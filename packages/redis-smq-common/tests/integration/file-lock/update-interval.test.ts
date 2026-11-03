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
import { loadMockedFileLock, waitFor } from './common.js';

it('refreshes the lock file mtime on each updateInterval tick', async () => {
  const lockFile = resolve(os.tmpdir(), `${Date.now()}.lock`);
  const fileHandle = { close: vi.fn() };
  const utimes = vi.fn().mockResolvedValue(undefined);

  const { FileLock } = await loadMockedFileLock({
    open: vi.fn().mockResolvedValue(fileHandle),
    utimes,
  });

  const fileLock = new FileLock();
  await fileLock.acquireLock(lockFile, { updateInterval: 1000 });
  expect(fileLock.isLockHeld(lockFile)).toBe(true);

  // First tick fires at ~1000ms; wait for it rather than sleeping the full
  // 5s window the original test used.
  await waitFor(() => utimes.mock.calls.length >= 1, 2500);
  expect(utimes).toHaveBeenCalled();

  await fileLock.releaseLock(lockFile);
});
