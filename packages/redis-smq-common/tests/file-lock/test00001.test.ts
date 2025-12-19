/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import os from 'node:os';
import { resolve } from 'path';
// Successfully acquire a lock when the lock file doesn't exist
import { expect, it } from 'vitest';
import { FileLock } from '../../src/file-lock/index.js';

it('should successfully acquire and release a lock', async () => {
  const lockFile = resolve(os.tmpdir(), `${Date.now()}.lock`);
  const fileLock = new FileLock();

  await fileLock.acquireLock(lockFile);

  expect(fileLock.isLockHeld(lockFile)).toBe(true);

  // Clean up
  await fileLock.releaseLock(lockFile);
});
