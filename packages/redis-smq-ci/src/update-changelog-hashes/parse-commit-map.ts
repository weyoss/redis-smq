/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { CommitMapping, HashReplacement } from './types/index.js';

export function parseCommitMappings(
  mappings: CommitMapping[],
): HashReplacement[] {
  return mappings.map((mapping) => ({
    oldHash: mapping.oldHash,
    newHash: mapping.newHash,
    shortOld7: mapping.oldHash.slice(0, 7),
    shortNew7: mapping.newHash.slice(0, 7),
    shortOld8: mapping.oldHash.slice(0, 8),
    shortNew8: mapping.newHash.slice(0, 8),
  }));
}
