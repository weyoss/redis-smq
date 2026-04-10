/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { existsSync, readFileSync } from 'fs';
import { CommitMapping } from './types/index.js';

export function readCommitMap(path: string): CommitMapping[] {
  if (!existsSync(path)) {
    throw new Error(`Commit map file not found: ${path}`);
  }

  const content = readFileSync(path, 'utf-8');
  const mappings: CommitMapping[] = [];

  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '') continue;

    const parts = trimmed.split(/\s+/);
    if (parts.length >= 2) {
      mappings.push({
        oldHash: parts[0],
        newHash: parts[1],
      });
    }
  }

  return mappings;
}
