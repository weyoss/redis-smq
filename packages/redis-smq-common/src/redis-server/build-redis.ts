/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { spawn } from 'child_process';
import { copyFile, chmod } from 'node:fs/promises';
import os from 'node:os';
import * as path from 'path';
import { archive } from '../archive/index.js';
import { env } from '../env/index.js';
import { FileLock } from '../file-lock/index.js';
import { getSupportedPlatform } from './get-supported-platform.js';
import { constants } from './constants.js';

const {
  REDIS_BINARY_PATH,
  REDIS_SETUP_LOCK_FILE,
  REDIS_SERVER_VERSION,
  REDIS_CACHE_DIRECTORY,
} = constants;

async function compileRedis(sourceDir: string): Promise<void> {
  console.log(`Compiling Redis (${sourceDir})...`);
  return new Promise((resolve, reject) => {
    const makeProcess = spawn('make', [], {
      cwd: sourceDir,
      stdio: 'inherit',
    });
    const onError = (err: Error) => {
      makeProcess.removeListener('close', onClose);
      makeProcess.kill();
      reject(err);
    };
    const onClose = (code: number) => {
      makeProcess.removeListener('error', onError);
      if (code === 0) {
        console.log('Redis compilation completed successfully.');
        resolve();
      } else {
        reject(new Error(`Redis compilation failed with exit code ${code}.`));
      }
    };
    makeProcess.once('error', onError);
    makeProcess.once('close', onClose);
  });
}

export async function buildRedisBinary(): Promise<string> {
  // Validate system platform before continuing.
  // An error is thrown if the platform is not supported.
  getSupportedPlatform();

  const fileLock = new FileLock();
  try {
    await env.ensureDirectoryExists(REDIS_CACHE_DIRECTORY);
    await fileLock.acquireLock(REDIS_SETUP_LOCK_FILE);

    const cacheExists = await env.doesPathExist(REDIS_BINARY_PATH);
    if (!cacheExists) {
      const tempDirectory = path.join(os.tmpdir(), String(Date.now()));
      await env.ensureDirectoryExists(tempDirectory);
      const sourcePath = `https://github.com/valkey-io/valkey/archive/refs/tags/${REDIS_SERVER_VERSION}.tar.gz`;
      const savePath = path.join(
        tempDirectory,
        `redis-${REDIS_SERVER_VERSION}.tar.gz`,
      );
      await env.downloadFile(sourcePath, savePath);
      const extractDirectory = path.join(tempDirectory, 'extracted');
      await env.ensureDirectoryExists(extractDirectory);
      await archive.extractTgz(savePath, extractDirectory);
      const sourceDir = path.join(
        extractDirectory,
        `valkey-${REDIS_SERVER_VERSION}`,
      );
      await compileRedis(sourceDir);
      const redisBin = path.join(
        extractDirectory,
        `valkey-${REDIS_SERVER_VERSION}`,
        'src',
        'valkey-server',
      );
      await copyFile(redisBin, REDIS_BINARY_PATH);
      await chmod(REDIS_BINARY_PATH, 0o755); // Sets the file to be executable
    }

    return REDIS_BINARY_PATH;
  } finally {
    await fileLock.releaseLock(REDIS_SETUP_LOCK_FILE);
  }
}
