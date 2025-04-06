/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import os from 'node:os';
import path from 'path';

export function getCacheDir() {
  switch (os.platform()) {
    case 'darwin':
      return path.join(os.homedir(), 'Library', 'Caches');
    case 'linux':
      return path.join(os.homedir(), '.cache');
    default:
      throw new Error('Unsupported platform');
  }
}
