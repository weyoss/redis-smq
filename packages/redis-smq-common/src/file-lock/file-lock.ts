/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { FileHandle, open, unlink, stat, utimes } from 'node:fs/promises';
import { dirname } from 'node:path';
import { env } from '../env/index.js';
import {
  FileLockAttemptsExhaustedError,
  FileLockError,
} from './errors/index.js';

/**
 * Checks if an error is an "access denied" error
 * @param err Error to check
 * @returns True if the error indicates access was denied
 */
function isAccessDeniedError(err: unknown): boolean {
  return (
    err instanceof Error &&
    'code' in err &&
    (err.code === 'EACCES' || err.code === 'EPERM')
  );
}

/**
 * Checks if an error is a "file exists" error
 * @param err Error to check
 * @returns True if the error indicates the file already exists
 */
function isFileExistsError(err: unknown): boolean {
  return err instanceof Error && 'code' in err && err.code === 'EEXIST';
}

/**
 * Checks if an error is a "file not found" error
 * @param err Error to check
 * @returns True if the error indicates the file was not found
 */
function isFileNotFoundError(err: unknown): boolean {
  return err instanceof Error && 'code' in err && err.code === 'ENOENT';
}

/**
 * Gets a string message from an error
 * @param err Error to get message from
 * @returns Error message
 */
function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : JSON.stringify(err);
}

/**
 * Interface for lock information
 */
interface LockInfo {
  fileHandle: FileHandle;
  updateInterval: NodeJS.Timeout | null;
}

/**
 * A file-based locking mechanism for coordinating access to shared resources
 * across processes. Provides methods to acquire and release locks with configurable
 * retry behavior, stale lock detection, and automatic cleanup on process exit.
 * Maintains lock state with periodic updates to prevent locks from being considered
 * stale by other processes.
 */
export class FileLock {
  private static activeLocks = new Map<string, LockInfo>();

  // Default retry delay in milliseconds (1 min)
  private defaultRetryDelay = 1000;

  // Default number of retries (100)
  private defaultRetries = 100;

  // Default stale lock timeout in milliseconds (5 minutes)
  private readonly defaultStaleTimeout = 5 * 60 * 1000;

  // Default update interval in milliseconds (1 minute)
  private readonly defaultUpdateInterval = 60 * 1000;

  constructor() {
    this.setupCleanup();
  }

  /**
   * Sets up cleanup handlers to ensure all locks are released when the process exits
   */
  private setupCleanup(): void {
    const cleanUp = async (): Promise<void> => {
      for (const [lockFile, lockInfo] of FileLock.activeLocks.entries()) {
        try {
          // Clear the update interval if it exists
          if (lockInfo.updateInterval) {
            clearInterval(lockInfo.updateInterval);
          }

          // Close the file handle
          await lockInfo.fileHandle.close();

          // Try to remove the lock file
          await unlink(lockFile).catch(() => {});
        } catch (err) {
          // Just log errors during cleanup
          console.error(`Error releasing lock ${lockFile} during exit:`, err);
        }
      }

      // Clear the active locks map
      FileLock.activeLocks.clear();
    };

    process.once('exit', cleanUp);
    process.once('SIGINT', cleanUp);
    process.once('SIGTERM', cleanUp);
    process.once('SIGUSR2', cleanUp);
  }

  /**
   * Updates the modification time of a lock file to the current time
   * @param lockFile Path to the lock file
   */
  private async updateLockFileMtime(lockFile: string): Promise<void> {
    try {
      const now = new Date();
      await utimes(lockFile, now, now);
    } catch (err) {
      // If the file doesn't exist, stop the update interval
      if (isFileNotFoundError(err)) {
        const lockInfo = FileLock.activeLocks.get(lockFile);
        if (lockInfo?.updateInterval) {
          clearInterval(lockInfo.updateInterval);
          lockInfo.updateInterval = null;
        }
      }
      // Other errors are ignored - we'll try again on the next interval
    }
  }

  /**
   * Checks if a lock file is stale based on its modification time
   * @param lockFile Path to the lock file
   * @param staleTimeout Timeout in milliseconds after which a lock is considered stale
   * @returns Promise that resolves to true if the lock is stale
   */
  private async isLockStale(
    lockFile: string,
    staleTimeout: number = this.defaultStaleTimeout,
  ): Promise<boolean> {
    try {
      const stats = await stat(lockFile);
      const now = Date.now();
      const mtime = stats.mtime.getTime();

      // If the file hasn't been modified in staleTimeout ms, consider it stale
      return now - mtime > staleTimeout;
    } catch (err) {
      // If the file doesn't exist, it's not stale
      if (isFileNotFoundError(err)) {
        return false;
      }

      // For other errors, assume the lock might be stale
      return true;
    }
  }

  /**
   * Acquires a lock on the specified resource
   * @param lockFile Lock file
   * @param options Lock acquisition options
   * @returns Promise that resolves when the lock is acquired
   */
  async acquireLock(
    lockFile: string,
    options: {
      retries?: number;
      retryDelay?: number;
      staleTimeout?: number;
      updateInterval?: number;
    } = {},
  ): Promise<void> {
    if (this.isLockHeld(lockFile)) {
      return;
    }

    const {
      retries = this.defaultRetries,
      retryDelay = this.defaultRetryDelay,
      staleTimeout = this.defaultStaleTimeout,
      updateInterval = this.defaultUpdateInterval,
    } = options;

    let attempts = 0;

    // Ensure the lock file's directory exists
    await env.ensureDirectoryExists(dirname(lockFile));

    while (attempts < retries) {
      try {
        // Try to create the lock file if not exists
        const fileHandle = await open(lockFile, 'wx');

        // Set up an interval to update the lock file's mtime
        const intervalId = setInterval(() => {
          this.updateLockFileMtime(lockFile).catch(() => {});
        }, updateInterval);

        // Store the file handle and update interval
        FileLock.activeLocks.set(lockFile, {
          fileHandle,
          updateInterval: intervalId,
        });

        // Successfully acquired the lock
        return;
      } catch (err) {
        if (isAccessDeniedError(err) || isFileExistsError(err)) {
          // Check if the lock file is stale
          const isStale = await this.isLockStale(lockFile, staleTimeout);

          if (isStale) {
            try {
              // Try to remove the stale lock file
              await unlink(lockFile);
              // Continue immediately to try acquiring the lock again
              continue;
            } catch (unlinkErr) {
              // If we can't remove the lock file, just continue with the retry
              if (!isFileNotFoundError(unlinkErr)) {
                console.warn(
                  `Failed to remove stale lock file ${lockFile}: ${getErrorMessage(unlinkErr)}`,
                );
              }
            }
          }

          // Lock is held by another process, wait and retry
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
          attempts++;
          continue;
        }
        // For any other error, throw
        throw new FileLockError(
          `Failed to acquire lock (${lockFile}): ${getErrorMessage(err)}`,
        );
      }
    }

    // If we get here, we've exhausted our retries
    throw new FileLockAttemptsExhaustedError(lockFile, retries);
  }

  /**
   * Releases a previously acquired lock
   * @param lockFile Lock file
   * @returns Promise that resolves when the lock is released
   */
  async releaseLock(lockFile: string): Promise<void> {
    const lockInfo = FileLock.activeLocks.get(lockFile);
    if (!lockInfo) {
      return;
    }

    try {
      // Clear the update interval if it exists
      if (lockInfo.updateInterval) {
        clearInterval(lockInfo.updateInterval);
      }

      // Close the file handle
      await lockInfo.fileHandle.close();

      // Remove from active locks
      FileLock.activeLocks.delete(lockFile);

      // Try to remove the lock file
      await unlink(lockFile);
    } catch (err) {
      // Ignore if file doesn't exist
      if (!isFileNotFoundError(err)) {
        throw new FileLockError(
          `Failed to release lock on (${lockFile}): ${getErrorMessage(err)}`,
        );
      }
    }
  }

  /**
   * Checks if a lock is currently held by this process
   * @param lockFile Lock file
   * @returns True if the lock is held by this process
   */
  isLockHeld(lockFile: string): boolean {
    return FileLock.activeLocks.has(lockFile);
  }
}
