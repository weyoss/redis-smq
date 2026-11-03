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

it('closes held handles and unlinks every lock file on process exit', async () => {
  const lockFile1 = resolve(os.tmpdir(), `${Date.now()}1.lock`);
  const lockFile2 = resolve(os.tmpdir(), `${Date.now()}2.lock`);
  const fileHandle1 = { close: vi.fn() };
  const fileHandle2 = { close: vi.fn() };
  const unlink = vi.fn().mockResolvedValue(undefined);

  // Capture the registered exit handler via a mocked `process.once`.
  let exitHandler: () => void = () => undefined;
  const once = vi.fn().mockImplementation((event: string, cb: () => void) => {
    if (event === 'exit') exitHandler = cb;
    return process;
  });

  const open = vi
    .fn()
    .mockResolvedValueOnce(fileHandle1)
    .mockResolvedValueOnce(fileHandle2);

  const { FileLock } = await loadMockedFileLock(
    { open, unlink },
    { extraMocks: { import: { process: { once } } } },
  );

  const fileLock = new FileLock();
  await fileLock.acquireLock(lockFile1);
  await fileLock.acquireLock(lockFile2);
  expect(fileLock.isLockHeld(lockFile1)).toBe(true);
  expect(fileLock.isLockHeld(lockFile2)).toBe(true);

  exitHandler();

  await waitFor(() => unlink.mock.calls.length === 2);
  expect(fileHandle1.close).toHaveBeenCalled();
  expect(fileHandle2.close).toHaveBeenCalled();
  expect(unlink).toHaveBeenCalledWith(lockFile1);
  expect(unlink).toHaveBeenCalledWith(lockFile2);
});
