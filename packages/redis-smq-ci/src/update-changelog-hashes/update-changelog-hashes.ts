/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { resolve } from 'path';
import { readCommitMap } from './read-commit-map.js';
import { parseCommitMappings } from './parse-commit-map.js';
import { findChangelogFiles } from './find-changelog-files.js';
import { HashReplacer } from './hash-replacer.js';
import { UpdateChangelogHashesOptions, UpdateResult } from './types/index.js';

export async function updateChangelogHashes(
  options: UpdateChangelogHashesOptions,
): Promise<void> {
  const {
    commitMap = '.git/filter-repo/commit-map',
    dryRun = false,
    verbose = false,
    noBackup = false,
  } = options;

  const commitMapPath = resolve(process.cwd(), commitMap);
  const rootDir = process.cwd();

  // Print header
  console.log('============================================================');
  console.log('UPDATE CHANGELOG HASHES');
  console.log('============================================================');
  console.log(`Commit map: ${commitMapPath}`);
  console.log(`Root directory: ${rootDir}`);
  console.log('');
  if (dryRun) console.log('⚠️  DRY RUN MODE - No files will be modified\n');

  // Step 1: Read commit map
  console.log('📖 Step 1: Reading commit map...');
  let mappings;
  try {
    mappings = readCommitMap(commitMapPath);
    console.log(`   Found ${mappings.length} commit mappings\n`);
  } catch (error: unknown) {
    console.error(`   Error: ${error}`);
    process.exit(1);
  }

  if (mappings.length === 0) {
    console.warn('   Warning: No mappings found in commit map');
    return;
  }

  // Step 2: Parse mappings into replacements
  console.log('🔧 Step 2: Parsing commit mappings...');
  const replacements = parseCommitMappings(mappings);
  if (verbose) {
    for (const r of replacements.slice(0, 10)) {
      console.log(`   ${r.shortOld7} → ${r.shortNew7}`);
    }
    if (replacements.length > 10) {
      console.log(`   ... and ${replacements.length - 10} more`);
    }
  }
  console.log('');

  // Step 3: Find all CHANGELOG.md files
  console.log('📁 Step 3: Finding CHANGELOG.md files...');
  const changelogFiles = await findChangelogFiles(rootDir);
  console.log(`   Found ${changelogFiles.length} CHANGELOG.md files\n`);

  if (changelogFiles.length === 0) {
    console.warn('   Warning: No CHANGELOG.md files found');
    return;
  }

  if (verbose) {
    for (const file of changelogFiles) {
      console.log(`     - ${file}`);
    }
    console.log('');
  }

  // Step 4: Process each file
  console.log('🔄 Step 4: Updating commit hashes in CHANGELOG.md files...');
  const replacer = new HashReplacer(dryRun, noBackup, verbose);
  const results: UpdateResult[] = [];

  for (const file of changelogFiles) {
    console.log(`\n  Processing: ${file}`);
    const result = replacer.updateFile(file, replacements);

    if (result.error) {
      console.log(`    ✗ Error: ${result.error}`);
    } else if (result.updated) {
      console.log(`    ✓ Updated ${result.replacementCount} commit references`);
      results.push(result);
    } else {
      console.log(`    ⚠ No changes needed`);
    }
  }

  // Step 5: Summary
  console.log('\n============================================================');
  console.log('SUMMARY');
  console.log('============================================================');
  console.log(`Commit mappings found: ${mappings.length}`);
  console.log(`CHANGELOG files processed: ${changelogFiles.length}`);
  console.log(`Files updated: ${results.length}`);

  const totalReplacements = results.reduce(
    (sum, r) => sum + r.replacementCount,
    0,
  );
  console.log(`Total replacements: ${totalReplacements}`);

  // Show backup files
  const backups = results.filter((r) => r.backupPath).map((r) => r.backupPath!);
  if (backups.length > 0 && !dryRun && !noBackup) {
    console.log('\nBackup files created:');
    for (const backup of backups) {
      console.log(`  - ${backup}`);
    }
    console.log('\nTo remove backups after verification:');
    console.log('  find . -name "*.backup" -type f -delete');
  }

  if (dryRun) {
    console.log(
      '\n⚠️  DRY RUN - No files were modified. Remove --dry-run to apply changes.',
    );
  } else {
    console.log('\n✅ Done!');
  }
}
