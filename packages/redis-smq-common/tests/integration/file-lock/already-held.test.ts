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
import { loadMockedFileLock } from './common.js';

it('does not re-open or re-ensure the directory for an already-held lock', async () => {
  const lockFile = resolve(os.tmpdir(), `${Date.now()}.lock`);
  const fileHandle = { close: vi.fn() };
  const open = vi.fn().mockResolvedValueOnce(fileHandle);
  const ensureDirectoryExists = vi.fn().mockResolvedValue(undefined);

  const { FileLock } = await loadMockedFileLock(
    { open },
    { ensureDirectoryExists },
  );

  const fileLock = new FileLock();
  await fileLock.acquireLock(lockFile);

  expect(open).toHaveBeenCalled();
  expect(ensureDirectoryExists).toHaveBeenCalled();

  // Reset, then acquire again — no fs side-effects should repeat.
  open.mockClear();
  ensureDirectoryExists.mockClear();

  await fileLock.acquireLock(lockFile);

  expect(open).not.toHaveBeenCalled();
  expect(ensureDirectoryExists).not.toHaveBeenCalled();
});
