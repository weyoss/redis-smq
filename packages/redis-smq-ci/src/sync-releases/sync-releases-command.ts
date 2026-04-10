/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { Command } from 'commander';
import { SyncReleasesOptions } from './types/index.js';
import { syncReleases } from './sync-releases.js';

export function syncReleasesCommand(program: Command) {
  program
    .command('sync-releases')
    .description(
      'Sync GitHub releases with CHANGELOG.md (CHANGELOG.md is the source of truth)',
    )
    .option(
      '-f, --from <version>',
      'Only process releases from this version (inclusive)',
    )
    .option(
      '-t, --to <version>',
      'Only process releases up to this version (inclusive)',
    )
    .option(
      '-c, --changelog <path>',
      'Path to CHANGELOG.md file',
      'CHANGELOG.md',
    )
    .option(
      '-d, --dry-run',
      'Show what would be updated without making changes',
      false,
    )
    .option(
      '--delete',
      'Delete GitHub releases within range before syncing',
      false,
    )
    .option('-v, --verbose', 'Show detailed processing information', false)
    .option(
      '--token <token>',
      'GitHub token (or set GITHUB_TOKEN environment variable)',
      '',
    )
    .action(async (options: SyncReleasesOptions) => {
      try {
        await syncReleases(options);
      } catch (error) {
        console.error(
          '❌ Error:',
          error instanceof Error ? error.message : error,
        );
        process.exit(1);
      }
    });
}
