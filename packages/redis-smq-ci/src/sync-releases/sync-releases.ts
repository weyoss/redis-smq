/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { getRepositoryFromGit } from './get-repository-from-git.js';
import { GitHubReleaseManager } from './github-release-manager.js';
import { readChangelog } from './read-changelog.js';
import { extractVersionsFromChangelog } from './extract-version-from-changelog.js';
import { isVersionInRange } from './is-version-in-range.js';
import { extractReleaseNotes } from './extract-release-notes.js';
import { SyncReleasesOptions } from './types/index.js';

function validateVersionFormat(version: string, name: string): void {
  const versionRegex = /^v?\d+\.\d+\.\d+(?:-(?:next|rc|alpha|beta)\.\d+)?$/;
  if (!versionRegex.test(version)) {
    throw new Error(
      `Invalid ${name} version format: ${version}. Expected format: 1.2.3 or 1.2.3-rc.1`,
    );
  }
}

export async function syncReleases(
  options: SyncReleasesOptions,
): Promise<void> {
  const {
    from,
    to,
    changelog: changelogPath = 'CHANGELOG.md',
    dryRun = false,
    delete: deleteMode = false,
    verbose = false,
    token,
  } = options;

  if (from) validateVersionFormat(from, 'from');
  if (to) validateVersionFormat(to, 'to');

  // Validate token
  const authToken = token || process.env.GITHUB_TOKEN;
  if (!authToken) {
    console.error(
      'Error: GitHub token required. Set GITHUB_TOKEN or use --token',
    );
    process.exit(1);
  }

  // Get repository info
  let owner: string, repo: string;
  try {
    ({ owner, repo } = getRepositoryFromGit());
  } catch (error: unknown) {
    console.error(`Error: ${error}`);
    process.exit(1);
  }

  // Initialize managers
  const releaseManager = new GitHubReleaseManager(
    authToken,
    owner,
    repo,
    dryRun,
  );

  // Print header
  console.log('============================================================');
  console.log('SYNCING GITHUB RELEASES WITH CHANGELOG.md');
  console.log('============================================================');
  console.log(`Changelog: ${changelogPath}`);
  console.log(`Repository: ${owner}/${repo}`);
  console.log('');
  if (dryRun) console.log('⚠️  DRY RUN MODE - No changes will be made\n');
  if (deleteMode) console.log('🗑️  DELETE MODE ENABLED\n');

  // Step 1: Extract versions from CHANGELOG
  console.log('📖 Step 1: Extracting versions from CHANGELOG.md...');
  const changelogContent = readChangelog(changelogPath);
  const allVersions = extractVersionsFromChangelog(changelogContent);
  console.log(`   Found ${allVersions.length} versions\n`);

  if (allVersions.length === 0) {
    console.error('Error: No versions found in CHANGELOG.md');
    process.exit(1);
  }

  // Step 2: Filter versions by range
  const filterText = [from && `from ${from}`, to && `up to ${to}`]
    .filter(Boolean)
    .join(' ');
  console.log(
    `📋 Step 2: Filtering versions${filterText ? ` (${filterText})` : ''}...`,
  );

  const versionsToSync = allVersions.filter((v) =>
    isVersionInRange(v.replace(/^v/, ''), from, to),
  );

  if (verbose) {
    for (const v of allVersions) {
      console.log(`  ${versionsToSync.includes(v) ? '✓' : '✗'} ${v}`);
    }
  } else {
    console.log(`   Included: ${versionsToSync.length}`);
    console.log(`   Excluded: ${allVersions.length - versionsToSync.length}`);
  }
  console.log('');

  // Step 3: Fetch GitHub releases
  console.log('📡 Step 3: Fetching current GitHub releases...');
  const githubReleases = await releaseManager.getReleases();
  console.log(`   Found ${githubReleases.length} releases\n`);

  // Step 4: Normalize release titles
  console.log('🏷️  Step 4: Normalizing release titles...');
  const titleStats = { updated: 0, skipped: 0, failed: 0 };

  for (const release of githubReleases) {
    if (
      release.name &&
      release.name !== release.tagName &&
      release.name !== 'null'
    ) {
      console.log(`  Processing: ${release.tagName}`);
      const success = await releaseManager.updateReleaseTitle(
        release.tagName,
        release.name,
        release.tagName,
      );
      if (success) titleStats.updated++;
      else titleStats.failed++;
      await new Promise((resolve) => setTimeout(resolve, 500));
    } else {
      if (verbose) console.log(`  [SKIP] ${release.tagName}`);
      titleStats.skipped++;
    }
  }

  console.log(
    `\n  Title summary: Updated: ${titleStats.updated}, Skipped: ${titleStats.skipped}, Failed: ${titleStats.failed}\n`,
  );

  // Step 5: Delete releases (if enabled)
  const deleteStats = { deleted: 0, skipped: 0, failed: 0 };

  if (deleteMode) {
    console.log('🗑️  Step 5: Deleting GitHub releases within range...');

    for (const release of githubReleases) {
      const version = release.tagName.replace(/^v/, '');
      const inRange = isVersionInRange(version, from, to);

      console.log(
        `  Processing: ${release.tagName}${!inRange ? ' (outside range)' : ''}`,
      );

      if (inRange) {
        const success = await releaseManager.deleteRelease(release.tagName);
        if (success) deleteStats.deleted++;
        else deleteStats.failed++;
        await new Promise((resolve) => setTimeout(resolve, 500));
      } else {
        deleteStats.skipped++;
      }
    }

    console.log(
      `\n  Delete summary: Deleted: ${deleteStats.deleted}, Skipped: ${deleteStats.skipped}, Failed: ${deleteStats.failed}\n`,
    );
  }

  // Step 6: Create/update releases
  const stepNum = deleteMode ? 6 : 5;
  console.log(
    `📝 Step ${stepNum}: Creating/updating releases from CHANGELOG.md...`,
  );

  const releaseStats = { created: 0, skipped: 0, failed: 0 };

  for (const version of versionsToSync) {
    console.log(`  [${version}] Processing...`);

    const releaseNotes = extractReleaseNotes(version, changelogContent);

    if (releaseNotes) {
      const lineCount = releaseNotes.split('\n').length;
      console.log(`    ✓ Content: ${lineCount} lines`);

      const success = await releaseManager.createOrUpdateRelease(
        version,
        releaseNotes,
      );
      if (success) releaseStats.created++;
      else releaseStats.failed++;
      await new Promise((resolve) => setTimeout(resolve, 500));
    } else {
      console.log(`    ⚠ No changelog section found`);
      releaseStats.skipped++;
    }
    console.log('');
  }

  // Step 7: Summary
  console.log('============================================================');
  console.log('SUMMARY');
  console.log('============================================================');
  console.log(`Versions in CHANGELOG: ${allVersions.length}`);
  console.log(`Versions to sync: ${versionsToSync.length}\n`);

  console.log(
    `Title updates: ${titleStats.updated} updated, ${titleStats.skipped} skipped, ${titleStats.failed} failed`,
  );
  if (deleteMode) {
    console.log(
      `Deletions: ${deleteStats.deleted} deleted, ${deleteStats.skipped} skipped, ${deleteStats.failed} failed`,
    );
  }
  console.log(
    `Releases: ${releaseStats.created} created/updated, ${releaseStats.skipped} skipped, ${releaseStats.failed} failed`,
  );
  console.log('');

  if (dryRun) {
    console.log(
      '⚠️  DRY RUN - No changes were made. Remove --dry-run to apply changes.',
    );
  } else {
    console.log('✅ Sync complete!');
  }

  console.log('Done!');
}
