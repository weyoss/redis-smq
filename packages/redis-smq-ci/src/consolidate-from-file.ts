/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IChangelogEntry, IConsolidateOptions } from './types/index.js';
import { parseChangelog } from './parse-changelog.js';
import fs from 'fs/promises';
import { filterEntriesByVersion } from './filter-entries-by-version.js';
import { validateRange } from './validate-range.js';
import { generateOutputFilename } from './generate-output-filename.js';
import path from 'path';
import { consolidateChangelogFromEntries } from './consolidate-from-entries.js';
import { compareVersions } from './compare-versions.js';
import { isPreRelease } from './is-prerelease.js';
import { getBaseVersion } from './get-base-version.js';
import { isFinalRelease } from './is-final-release.js';

/**
 * Check if an error is a Node.js file not found error
 */
function isFileNotFoundError(error: unknown): boolean {
  return (
    error !== null &&
    typeof error === 'object' &&
    'code' in error &&
    error.code === 'ENOENT'
  );
}

/**
 * Get the next release version from entries
 */
function getNextReleaseVersionFromEntries(
  entries: Map<string, IChangelogEntry>,
): string | null {
  const sortedVersions = Array.from(entries.keys()).sort(compareVersions);

  if (sortedVersions.length === 0) {
    return null;
  }

  const preReleases = sortedVersions.filter(isPreRelease);

  if (preReleases.length > 0) {
    // Get the highest base version among pre-releases
    const highestBase = preReleases
      .map((v) => getBaseVersion(v))
      .sort(compareVersions)
      .pop();
    return highestBase || null;
  }

  return null;
}

/**
 * Get the first pre-release after the last final release
 * If there are no final releases, returns the first pre-release
 */
function getFirstPreReleaseAfterLastFinal(
  entries: Map<string, IChangelogEntry>,
): string | null {
  const sortedVersions = Array.from(entries.keys()).sort(compareVersions);

  // Find all final releases
  const finalReleases = sortedVersions.filter(isFinalRelease);

  // Get the last final release
  const lastFinalRelease =
    finalReleases.length > 0 ? finalReleases[finalReleases.length - 1] : null;

  // Find the first pre-release after the last final release
  for (const version of sortedVersions) {
    if (isPreRelease(version)) {
      if (!lastFinalRelease || compareVersions(version, lastFinalRelease) > 0) {
        return version;
      }
    }
  }

  return null;
}

/**
 * Consolidates changelog entries from a file
 * Handles all validation, filtering, and file operations
 */
export async function consolidateChangelogFromFile(
  options: IConsolidateOptions,
): Promise<void> {
  const {
    inputPath,
    outputPath: providedOutputPath,
    dryRun = false,
    verbose = false,
    outputDir,
    force = false,
    since: providedSince,
    until,
    includeMetadata = true,
    preserveOrder = false,
    sectionOrder = [],
  } = options;

  if (verbose) {
    console.log(`📖 Reading changelog from: ${inputPath}`);
  }

  // Read and parse changelog
  const content = await fs.readFile(inputPath, 'utf-8');
  const allEntries = parseChangelog(content);

  if (verbose) {
    console.log(`✓ Found ${allEntries.size} version entries`);
  }

  // Auto-detect since if not provided
  let since = providedSince;
  if (!since) {
    const firstPreRelease = getFirstPreReleaseAfterLastFinal(allEntries);
    if (firstPreRelease) {
      since = firstPreRelease;
      if (verbose) {
        console.log(
          `🔍 Auto-detected --since: ${since} (first pre-release after last final release)`,
        );
      }
    } else {
      if (verbose) {
        console.log(`⚠ No pre-releases found after last final release`);
      }
      return;
    }
  }

  // Apply since/until filters
  const entries = filterEntriesByVersion(allEntries, since, until);

  if (verbose) {
    console.log(
      `✓ Filtered to ${entries.size} version entries (since: ${since}, until: ${until || 'end'})`,
    );
  }

  if (entries.size === 0) {
    console.log('⚠ No entries found after filtering');
    return;
  }

  // Validate the range (ensures no final releases with pre-releases)
  validateRange(entries);

  // Determine output path
  let outputPath: string;
  if (providedOutputPath) {
    outputPath = providedOutputPath;
  } else {
    const nextReleaseVersion = getNextReleaseVersionFromEntries(entries);
    if (nextReleaseVersion) {
      outputPath = generateOutputFilename(nextReleaseVersion);
      if (verbose) {
        console.log(`📝 Next release version: ${nextReleaseVersion}`);
        console.log(`📝 Generated filename: ${outputPath}`);
      }
    } else {
      outputPath = 'CONSOLIDATED_CHANGELOG.md';
      if (verbose) {
        console.log(
          `📝 Could not determine next release version, using default: ${outputPath}`,
        );
      }
    }
  }

  // Handle output directory
  if (outputDir) {
    await fs.mkdir(outputDir, { recursive: true });
    outputPath = path.join(outputDir, path.basename(outputPath));
  }

  // Check if output file exists
  if (!force) {
    try {
      await fs.access(outputPath);
      // File exists - throw error
      throw new Error(
        `Output file "${outputPath}" already exists. Use --force to overwrite.`,
      );
    } catch (error: unknown) {
      // If file doesn't exist, continue
      if (isFileNotFoundError(error)) {
        // Continue execution
      } else {
        // Re-throw any other error
        throw error;
      }
    }
  }

  // Consolidate entries
  const output = consolidateChangelogFromEntries(entries, {
    preserveOrder,
    includeMetadata,
    sectionOrder,
  });

  // Write output
  if (dryRun) {
    console.log('\n--- DRY RUN ---\n');
    console.log(output);
    console.log('\n--- END DRY RUN ---\n');
    console.log(`✓ Would write to: ${outputPath}`);
  } else {
    await fs.writeFile(outputPath, output, 'utf-8');
    console.log(`✓ Consolidated changelog written to ${outputPath}`);
  }

  if (verbose) {
    const stats = {
      versions: entries.size,
      outputSize: output.length,
      lines: output.split('\n').length,
    };
    console.log('\n📊 Statistics:');
    console.log(`  - Pre-releases consolidated: ${stats.versions}`);
    console.log(`  - Output lines: ${stats.lines}`);
    console.log(`  - Output size: ${(stats.outputSize / 1024).toFixed(2)} KB`);
  }
}
