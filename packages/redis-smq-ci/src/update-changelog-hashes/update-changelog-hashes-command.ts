/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { Command } from 'commander';
import { updateChangelogHashes } from './update-changelog-hashes.js';
import { UpdateChangelogHashesOptions } from './types/index.js';

export function updateChangelogHashesCommand(program: Command): void {
  program
    .command('update-changelog-hashes')
    .description(
      'Replace old commit hashes in CHANGELOG.md files with new ones using .git/filter-repo/commit-map',
    )
    .option(
      '-m, --commit-map <path>',
      'Path to commit-map file',
      '.git/filter-repo/commit-map',
    )
    .option('-d, --dry-run', 'Preview changes without writing to file', false)
    .option('-v, --verbose', 'Show detailed processing information', false)
    .option('--no-backup', 'Skip creating backup files', false)
    .addHelpText(
      'after',
      `
Examples:
  $ redis-smq-ci update-changelog-hashes
  $ redis-smq-ci update-changelog-hashes --dry-run
  $ redis-smq-ci update-changelog-hashes -v
  $ redis-smq-ci update-changelog-hashes --commit-map .git/filter-repo/commit-map
  $ redis-smq-ci update-changelog-hashes --no-backup

Note:
  This command should be run after using git-filter-repo to rewrite history.
  It replaces both full (40-character) and short (7/8-character) commit hashes
  in all CHANGELOG.md files (root and under packages/).
      `,
    )
    .action(async (options: UpdateChangelogHashesOptions) => {
      try {
        await updateChangelogHashes(options);
      } catch (error) {
        console.error(
          '❌ Error:',
          error instanceof Error ? error.message : error,
        );
        process.exit(1);
      }
    });
}
