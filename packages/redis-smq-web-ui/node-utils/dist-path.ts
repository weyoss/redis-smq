/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import path from 'path';
import { env } from 'redis-smq-common';

/**
 * Get the absolute path to the dist directory containing the built SPA assets
 * @returns {string} The absolute path to the dist directory
 */
export function getDistPath(): string {
  const curDir = env.getCurrentDir();

  // When this file is in dist/node/{esm,cjs}/, we need to return the parent directory
  return path.resolve(curDir, '../../../browser');
}
