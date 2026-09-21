/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

const VERSION = 10;
const SEP = ':';
const PREFIX = `redis-smq${SEP}${VERSION}`;

export function key(...segments: string[]): string {
  return [PREFIX, ...segments].join(SEP);
}
