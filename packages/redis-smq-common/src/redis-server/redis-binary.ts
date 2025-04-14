/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { chmod, copyFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'path';
import { archive } from '../archive/index.js';
import { env } from '../env/index.js';
import { FileLock } from '../file-lock/index.js';
import {
  REDIS_BINARY_PATH,
  REDIS_CACHE_DIRECTORY,
  REDIS_SETUP_LOCK_FILE,
} from './constants.js';
import { RedisServerUnsupportedPlatformError } from './errors/index.js';

// Pre-built Redis binary URLs for supported platforms and architectures
const tarballs: Record<string, Record<string, string>> = {
  linux: {
    x64: 'https://github.com/weyoss/valkey/releases/download/v7.2.8-2/valkey-server-linux-x64-v7.2.8-2.tar.gz',
    arm64:
      'https://github.com/weyoss/valkey/releases/download/v7.2.8-2/valkey-server-linux-arm64-v7.2.8-2.tar.gz',
  },
  darwin: {
    x64: 'https://github.com/weyoss/valkey/releases/download/v7.2.8-2/valkey-server-macos-x64-v7.2.8-2.tar.gz',
    arm64:
      'https://github.com/weyoss/valkey/releases/download/v7.2.8-2/valkey-server-macos-arm64-v7.2.8-2.tar.gz',
  },
};

// Downloads and extracts the Redis binary
async function downloadAndExtractRedis(downloadPath: string): Promise<string> {
  const platform = os.platform();
  const arch = os.arch();
  const url = tarballs[platform][arch];
  if (!url) {
    throw new RedisServerUnsupportedPlatformError();
  }

  const tarballPath = path.join(downloadPath, 'redis-server.tar.gz');
  await env.downloadFile(url, tarballPath);

  const extractionDir = path.join(downloadPath, 'extracted');
  await env.ensureDirectoryExists(extractionDir);
  await archive.extractTgz(tarballPath, extractionDir);

  return path.join(extractionDir, 'src', 'valkey-server');
}

// Downloads and sets up the Redis binary
export async function downloadPrebuiltBinary(): Promise<string> {
  const fileLock = new FileLock();
  try {
    await env.ensureDirectoryExists(REDIS_CACHE_DIRECTORY);
    await fileLock.acquireLock(REDIS_SETUP_LOCK_FILE);

    if (!(await env.doesPathExist(REDIS_BINARY_PATH))) {
      const tempDir = path.join(os.tmpdir(), `redis-${Date.now()}`);
      await env.ensureDirectoryExists(tempDir);

      const redisBinary = await downloadAndExtractRedis(tempDir);
      await copyFile(redisBinary, REDIS_BINARY_PATH);
      await chmod(REDIS_BINARY_PATH, 0o755); // Make the binary executable
    }

    return REDIS_BINARY_PATH;
  } finally {
    await fileLock.releaseLock(REDIS_SETUP_LOCK_FILE);
  }
}
