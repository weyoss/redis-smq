/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, it } from 'vitest';
import os from 'node:os';
import { resolve } from 'node:path';
import { FileLock } from '../../../src/file-lock/index.js';

it('acquires and releases a lock on a fresh path', async () => {
  const lockFile = resolve(os.tmpdir(), `${Date.now()}.lock`);
  const fileLock = new FileLock();

  await fileLock.acquireLock(lockFile);
  expect(fileLock.isLockHeld(lockFile)).toBe(true);

  await fileLock.releaseLock(lockFile);
  expect(fileLock.isLockHeld(lockFile)).toBe(false);
});
