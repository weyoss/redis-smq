/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { existsSync, readFileSync } from 'fs';

export function readChangelog(path: string): string {
  if (!existsSync(path)) {
    throw new Error(`Changelog file not found: ${path}`);
  }
  return readFileSync(path, 'utf-8');
}
