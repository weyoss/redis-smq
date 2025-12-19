/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
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
  getSupportedPlatform,
  TRedisServerPlatform,
} from './get-supported-platform.js';
import { constants } from './constants.js';

const { REDIS_BINARY_PATH, REDIS_CACHE_DIRECTORY, REDIS_SETUP_LOCK_FILE } =
  constants;

// Pre-built Redis binary URLs for supported platforms and architectures
const tarballs: Record<TRedisServerPlatform, Record<string, string>> = {
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
async function downloadAndExtractRedis(
  url: string,
  downloadPath: string,
): Promise<string> {
  const tarballPath = path.join(downloadPath, 'redis-server.tar.gz');
  await env.downloadFile(url, tarballPath);

  const extractionDir = path.join(downloadPath, 'extracted');
  await env.ensureDirectoryExists(extractionDir);
  await archive.extractTgz(tarballPath, extractionDir);

  return path.join(extractionDir, 'src', 'valkey-server');
}

// Downloads and sets up the Redis binary
export async function downloadPrebuiltBinary(): Promise<string> {
  // Validate system platform before continuing.
  // An error is thrown if the platform is not supported.
  const platform = getSupportedPlatform();

  const fileLock = new FileLock();
  try {
    await env.ensureDirectoryExists(REDIS_CACHE_DIRECTORY);
    await fileLock.acquireLock(REDIS_SETUP_LOCK_FILE);

    if (!(await env.doesPathExist(REDIS_BINARY_PATH))) {
      const tempDir = path.join(os.tmpdir(), `redis-${Date.now()}`);
      await env.ensureDirectoryExists(tempDir);

      const arch = os.arch();
      const tarball = tarballs[platform][arch];
      const redisBinary = await downloadAndExtractRedis(tarball, tempDir);
      await copyFile(redisBinary, REDIS_BINARY_PATH);
      await chmod(REDIS_BINARY_PATH, 0o755); // Make the binary executable
    }

    return REDIS_BINARY_PATH;
  } finally {
    await fileLock.releaseLock(REDIS_SETUP_LOCK_FILE);
  }
}
