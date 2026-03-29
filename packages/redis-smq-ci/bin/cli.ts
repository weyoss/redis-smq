#!/usr/bin/env node

/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { Command } from 'commander';
import { consolidateChangelogFromFile } from '../src/index.js';
import { ICliOptions, IConsolidateOptions } from '../src/types/index.js';
import packageJson from '../package.json' with { type: 'json' };

const program = new Command();

program
  .name('redis-smq-ci')
  .description('Redis SMQ CLI tools')
  .version(packageJson.version);

program
  .command('consolidate-changelog')
  .description('Consolidates changelog entries for major releases')
  .argument('[input]', 'Input changelog file path', 'CHANGELOG.md')
  .argument(
    '[output]',
    'Output consolidated changelog file path (default: generated from next release version)',
  )
  .option(
    '-p, --preserve-order',
    'Preserve original version order (default: sort newest first)',
    false,
  )
  .option('-d, --dry-run', 'Preview changes without writing to file', false)
  .option('-v, --verbose', 'Show detailed processing information', false)
  .option(
    '-o, --output-dir <dir>',
    'Output directory (overrides output path)',
    '',
  )
  .option('-f, --force', 'Overwrite output file if it exists', false)
  .option(
    '-s, --since <version>',
    'Only include versions since specified version',
    '',
  )
  .option(
    '-u, --until <version>',
    'Only include versions until specified version',
    '',
  )
  .option('--no-metadata', 'Exclude generation metadata comment', true)
  .option(
    '--section-order <order>',
    'Comma-separated list of section order',
    '',
  )
  .action(
    async (input: string, output: string | undefined, options: ICliOptions) => {
      try {
        // Prepare consolidation options
        const consolidateOptions: IConsolidateOptions = {
          inputPath: input,
          outputPath: output,
          preserveOrder: options.preserveOrder,
          dryRun: options.dryRun,
          verbose: options.verbose,
          outputDir: options.outputDir,
          force: options.force,
          since: options.since,
          until: options.until,
          includeMetadata: options.metadata,
          sectionOrder: options.sectionOrder
            ? options.sectionOrder.split(',').map((s) => s.trim())
            : undefined,
        };

        // Delegate everything to the library
        await consolidateChangelogFromFile(consolidateOptions);
      } catch (error) {
        console.error(
          '❌ Error:',
          error instanceof Error ? error.message : error,
        );
        process.exit(1);
      }
    },
  );

program.parse(process.argv);
