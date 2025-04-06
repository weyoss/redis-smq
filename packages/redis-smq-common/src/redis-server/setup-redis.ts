/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { access, constants, mkdir, copyFile, chmod } from 'node:fs/promises';
import os from 'node:os';
import { promisify } from 'node:util';
import * as path from 'path';
import { archive } from '../archive/index.js';
import { env } from '../env/index.js';
import { exec } from 'node:child_process';
import { fileLock } from '../file-lock/index.js';
import { downloadRedisBinary } from './download-redis-binary.js';

const REDIS_CACHE_DIRECTORY = path.join(env.getCacheDir(), 'redis-smq-common');
const REDIS_SETUP_LOCK_FILE = path.join(
  REDIS_CACHE_DIRECTORY,
  'redis-server-setup.lock',
);
const REDIS_BINARY_PATH = path.join(REDIS_CACHE_DIRECTORY, 'redis-server');

const execAsync = promisify(exec);

/**
 * Checks if a file or directory exists.
 *
 * @param {string} filePath - The path to check.
 * @returns {Promise<boolean>} - True if the file or directory exists, false otherwise.
 */
async function doesPathExist(filePath: string): Promise<boolean> {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Creates a directory if it doesn't exist.
 *
 * @param {string} dirPath - The directory path to create.
 * @returns {Promise<void>}
 */
async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await access(dirPath, constants.F_OK);
  } catch {
    await mkdir(dirPath, { recursive: true });
  }
}

/**
 * Retrieves the system-wide Redis binary path.
 *
 * @returns {Promise<string | null>} - The path to the system-wide Redis binary, or null if not found.
 */
async function fetchSystemWideRedisBinaryPath(): Promise<string | null> {
  try {
    const { stdout } = await execAsync(
      'which redis-server || where redis-server',
    );
    return stdout.trim() || null;
  } catch {
    return null;
  }
}

/**
 * Sets up and returns the path to the Redis server binary.
 * If a system-wide Redis server is already installed, it will be used.
 * Otherwise, the function will download and extract a pre-built Redis binary.
 *
 * @returns {Promise<string>} - The path to the Redis server binary.
 */
export async function initializeRedisServer(): Promise<string> {
  const systemWideBinaryPath = await fetchSystemWideRedisBinaryPath();
  if (systemWideBinaryPath) return systemWideBinaryPath;

  if (await doesPathExist(REDIS_BINARY_PATH)) {
    return REDIS_BINARY_PATH;
  }

  try {
    await ensureDirectoryExists(REDIS_CACHE_DIRECTORY);
    await fileLock.acquireLock(REDIS_SETUP_LOCK_FILE, {
      retries: 60 * 10,
      delay: 1000,
    });

    const cacheExists = await doesPathExist(REDIS_BINARY_PATH);
    if (!cacheExists) {
      const tempDirectory = path.join(os.tmpdir(), String(Date.now()));
      await ensureDirectoryExists(tempDirectory);
      const downloadedFilePath = await downloadRedisBinary(tempDirectory);
      const extractionDirectory = path.join(tempDirectory, 'extracted');
      await ensureDirectoryExists(extractionDirectory);
      await archive.extractTgz(downloadedFilePath, extractionDirectory);
      const extractedBinaryPath = path.join(
        extractionDirectory,
        'src',
        'valkey-server',
      );
      await copyFile(extractedBinaryPath, REDIS_BINARY_PATH);
      await chmod(REDIS_BINARY_PATH, 0o755); // Sets the file to be executable
    }

    return REDIS_BINARY_PATH;
  } finally {
    await fileLock.releaseLock(REDIS_SETUP_LOCK_FILE);
  }
}
