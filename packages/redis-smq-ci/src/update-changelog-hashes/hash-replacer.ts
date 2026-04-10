/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { readFileSync, writeFileSync, copyFileSync, unlinkSync } from 'fs';
import { HashReplacement, UpdateResult } from './types/index.js';

export class HashReplacer {
  private dryRun: boolean;
  private noBackup: boolean;
  private verbose: boolean;

  constructor(
    dryRun: boolean = false,
    noBackup: boolean = false,
    verbose: boolean = false,
  ) {
    this.dryRun = dryRun;
    this.noBackup = noBackup;
    this.verbose = verbose;
  }

  updateFile(filePath: string, replacements: HashReplacement[]): UpdateResult {
    const result: UpdateResult = {
      filePath,
      updated: false,
      replacementCount: 0,
    };

    // Read file content
    let content: string;
    try {
      content = readFileSync(filePath, 'utf-8');
    } catch (error: unknown) {
      result.error = `Failed to read file: ${error}`;
      return result;
    }

    // Create backup if needed
    if (!this.dryRun && !this.noBackup) {
      const backupPath = `${filePath}.backup`;
      copyFileSync(filePath, backupPath);
      result.backupPath = backupPath;
    }

    // Apply replacements
    let modifiedContent = content;
    let totalReplacements = 0;

    for (const replacement of replacements) {
      const { oldHash, newHash, shortOld7, shortNew7, shortOld8, shortNew8 } =
        replacement;

      // Check if any of these hashes exist in the content
      if (
        modifiedContent.includes(oldHash) ||
        modifiedContent.includes(shortOld8) ||
        modifiedContent.includes(shortOld7)
      ) {
        // Replace full hash
        if (modifiedContent.includes(oldHash)) {
          const count = (modifiedContent.match(new RegExp(oldHash, 'g')) || [])
            .length;
          modifiedContent = modifiedContent.split(oldHash).join(newHash);
          totalReplacements += count;
        }

        // Replace 8-character short hash
        if (
          shortOld8 !== oldHash &&
          shortOld8 !== shortOld7 &&
          modifiedContent.includes(shortOld8)
        ) {
          const count = (
            modifiedContent.match(new RegExp(shortOld8, 'g')) || []
          ).length;
          modifiedContent = modifiedContent.split(shortOld8).join(shortNew8);
          totalReplacements += count;
        }

        // Replace 7-character short hash
        if (shortOld7 !== oldHash && modifiedContent.includes(shortOld7)) {
          const count = (
            modifiedContent.match(new RegExp(shortOld7, 'g')) || []
          ).length;
          modifiedContent = modifiedContent.split(shortOld7).join(shortNew7);
          totalReplacements += count;
        }

        if (this.verbose) {
          console.log(
            `    ${shortOld7} → ${shortNew7} (${totalReplacements} replacements)`,
          );
        }
      }
    }

    // Check if content changed
    if (modifiedContent !== content) {
      result.updated = true;
      result.replacementCount = totalReplacements;

      if (!this.dryRun) {
        writeFileSync(filePath, modifiedContent, 'utf-8');
      }
    }

    return result;
  }

  cleanupBackup(backupPath: string): void {
    if (!this.dryRun && !this.noBackup) {
      try {
        unlinkSync(backupPath);
      } catch {
        // Ignore cleanup errors
      }
    }
  }
}
