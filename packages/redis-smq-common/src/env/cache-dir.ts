/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import os from 'node:os';
import path from 'path';

/**
 * Default cache directory paths for different platforms
 */
const CACHE_DIR: Partial<Record<NodeJS.Platform, string>> = {
  darwin: path.join(os.homedir(), 'Library', 'Caches'),
  linux: path.join(os.homedir(), '.cache'),
  win32:
    process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'),
  freebsd: path.join(os.homedir(), '.cache'),
  openbsd: path.join(os.homedir(), '.cache'),
  android: path.join(os.homedir(), '.cache'),
};

/**
 * Gets the appropriate cache directory for the current platform
 *
 * @returns {string} The path to the cache directory
 */
export function getCacheDir(): string {
  const platform = os.platform();
  const dir = CACHE_DIR[platform];
  if (!dir) {
    throw new Error(`Unsupported platform: ${platform}`);
  }
  return dir;
}
