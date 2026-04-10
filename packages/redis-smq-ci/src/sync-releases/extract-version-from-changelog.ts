/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

export function extractVersionsFromChangelog(content: string): string[] {
  const versions: string[] = [];
  const seen = new Set<string>();

  // Pattern: ## [version]
  const bracketMatches = content.matchAll(/^## \[([^\]]+)]/gm);
  for (const match of bracketMatches) {
    const version = `v${match[1]}`;
    if (!seen.has(version)) {
      seen.add(version);
      versions.push(version);
    }
  }

  // Pattern: ## version (date)
  const plainMatches = content.matchAll(
    /^## ([0-9]+\.[0-9]+\.[0-9]+(?:-[a-zA-Z0-9.]+)?) \(/gm,
  );
  for (const match of plainMatches) {
    const version = `v${match[1]}`;
    if (!seen.has(version)) {
      seen.add(version);
      versions.push(version);
    }
  }

  return versions;
}
