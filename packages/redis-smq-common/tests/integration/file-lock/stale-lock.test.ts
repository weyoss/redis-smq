/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, it } from 'vitest';
import { open, utimes } from 'node:fs/promises';
import os from 'node:os';
import { dirname, resolve } from 'node:path';
import { env } from '../../../src/env/index.js';
import { FileLock } from '../../../src/file-lock/index.js';

it('overrides a stale lock file and acquires the lock', async () => {
  const lockFile = resolve(os.tmpdir(), `${Date.now()}.lock`);
  const fileLock = new FileLock();

  // Arrange — create a stale lock file
  await env.ensureDirectoryExists(dirname(lockFile));
  const handle = await open(lockFile, 'w');
  await handle.close();

  const staleTime = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago
  await utimes(lockFile, staleTime, staleTime);

  // Act
  await fileLock.acquireLock(lockFile, { retryDelay: 100 });

  // Assert
  expect(fileLock.isLockHeld(lockFile)).toBe(true);

  await fileLock.releaseLock(lockFile);
});
