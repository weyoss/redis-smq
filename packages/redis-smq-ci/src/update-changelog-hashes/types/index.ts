/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

export interface CommitMapping {
  oldHash: string;
  newHash: string;
}

export interface UpdateResult {
  filePath: string;
  updated: boolean;
  replacementCount: number;
  backupPath?: string;
  error?: string;
}

export interface UpdateChangelogHashesOptions {
  commitMap?: string; // Path to commit-map file (default: .git/filter-repo/commit-map)
  dryRun?: boolean; // Preview changes without writing to file
  verbose?: boolean; // Show detailed processing information
  noBackup?: boolean; // Skip creating backup files
  since?: string; // Only process commits since this hash (not implemented yet)
}

export interface HashReplacement {
  oldHash: string;
  newHash: string;
  shortOld7: string;
  shortNew7: string;
  shortOld8: string;
  shortNew8: string;
}
