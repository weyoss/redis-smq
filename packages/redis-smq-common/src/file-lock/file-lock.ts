/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { promisify } from 'node:util';
import { open, unlink, readFile, writeFile } from 'node:fs/promises';
import { exec } from 'node:child_process';

const execPromise = promisify(exec);

function isError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error;
}

async function acquireLock(
  lockFile: string,
  options: { retries: number; delay: number },
): Promise<void> {
  const pid = process.pid.toString();
  let attempts = 0;

  while (attempts < options.retries) {
    try {
      const fd = await open(lockFile, 'wx');
      await writeFile(fd, pid);
      await fd.close();
      return; // Lock acquired successfully
    } catch (err: unknown) {
      if (isError(err) && err.code === 'EEXIST') {
        const existingPid = await readFile(lockFile, 'utf8');
        if (existingPid === pid) {
          // The lock is already held by the current process
          return;
        }
        const isProcessRunning = await checkProcessRunning(existingPid);
        if (!isProcessRunning) {
          // The process holding the lock is not running, so we can safely acquire the lock
          await unlink(lockFile);
          continue; // Retry acquiring the lock
        } else {
          // Lock is held by another process, wait and retry
          await new Promise((resolve) => setTimeout(resolve, options.delay));
          attempts++;
        }
      } else {
        throw err;
      }
    }
  }

  throw new Error(`Failed to acquire lock after ${options.retries} attempts`);
}

async function releaseLock(lockFile: string): Promise<void> {
  try {
    const existingPid = await readFile(lockFile, 'utf8');
    if (existingPid === process.pid.toString()) {
      await unlink(lockFile);
    } else {
      throw new Error(
        `Lock file is held by another process (PID: ${existingPid})`,
      );
    }
  } catch (err: unknown) {
    if (isError(err) && err.code === 'ENOENT') {
      // Lock file does not exist, nothing to release
      return;
    }
    throw err;
  }
}

async function checkProcessRunning(pid: string): Promise<boolean> {
  try {
    const { stdout } = await execPromise(`ps -p ${pid}`);
    return stdout.trim().split('\n').length > 1;
  } catch {
    return false;
  }
}

export const fileLock = {
  acquireLock,
  releaseLock,
};
