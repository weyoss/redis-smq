/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import * as cacheDir from './cache-dir.js';
import * as currentDir from './current-dir.js';
import * as filesystem from './filesystem.js';

export const env = {
  ...cacheDir,
  ...currentDir,
  ...filesystem,
};
