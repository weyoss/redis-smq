/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { open, utimes } from 'node:fs/promises';
import os from 'node:os';
import { dirname } from 'node:path';
import { resolve } from 'path';
import { expect, it } from 'vitest';
import { env } from '../../src/env/index.js';
import { FileLock } from '../../src/file-lock/index.js';

it('should remove stale lock files and acquire the lock', async () => {
  const lockFile = resolve(os.tmpdir(), `${Date.now()}.lock`);
  const fileLock = new FileLock();

  // Create a stale lock file
  await env.ensureDirectoryExists(dirname(lockFile));
  const fileHandle = await open(lockFile, 'w');
  await fileHandle.close();

  // Set the modification time to be older than the stale timeout
  const staleTime = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago
  await utimes(lockFile, staleTime, staleTime);

  // Try to acquire the lock with a short retry delay
  await fileLock.acquireLock(lockFile, { retryDelay: 100 });

  expect(fileLock.isLockHeld(lockFile)).toBe(true);

  // Clean up
  await fileLock.releaseLock(lockFile);
});
