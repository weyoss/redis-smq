/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { existsSync } from 'fs';
import { readdir } from 'fs/promises';
import { join } from 'path';

export async function findChangelogFiles(
  rootDir: string = process.cwd(),
): Promise<string[]> {
  const files: string[] = [];

  // Check root CHANGELOG.md
  const rootChangelog = join(rootDir, 'CHANGELOG.md');
  if (existsSync(rootChangelog)) {
    files.push(rootChangelog);
  }

  // Check packages directory
  const packagesDir = join(rootDir, 'packages');
  if (existsSync(packagesDir)) {
    await findChangelogInDir(packagesDir, files);
  }

  return files;
}

async function findChangelogInDir(dir: string, files: string[]): Promise<void> {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      // Check if this directory contains a CHANGELOG.md
      const changelogPath = join(fullPath, 'CHANGELOG.md');
      if (existsSync(changelogPath)) {
        files.push(changelogPath);
      }

      // Recursively search subdirectories (but limit depth to avoid node_modules)
      if (entry.name !== 'node_modules' && !entry.name.startsWith('.')) {
        await findChangelogInDir(fullPath, files);
      }
    }
  }
}
