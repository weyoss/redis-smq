/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IChangelogEntry } from './types/index.js';

/**
 * Parse changelog content into structured entries
 */
export function parseChangelog(content: string): Map<string, IChangelogEntry> {
  const entries = new Map<string, IChangelogEntry>();
  const lines = content.split('\n');

  let currentEntry: IChangelogEntry | null = null;
  let currentSection: string | null = null;

  for (const line of lines) {
    const versionMatch = line.match(/^## \[([^\]]+)]\([^)]+\) \(([^)]+)\)/);
    if (versionMatch) {
      if (currentEntry) {
        entries.set(currentEntry.version, currentEntry);
      }
      currentEntry = {
        version: versionMatch[1],
        date: versionMatch[2],
        sections: new Map(),
      };
      currentSection = null;
      continue;
    }

    if (!currentEntry) continue;

    const sectionMatch = line.match(/^### (.+)$/);
    if (sectionMatch) {
      currentSection = sectionMatch[1];
      if (!currentEntry.sections.has(currentSection)) {
        currentEntry.sections.set(currentSection, new Set());
      }
      continue;
    }

    if (currentSection && line.match(/^- /)) {
      const changes = currentEntry.sections.get(currentSection);
      if (changes) {
        changes.add(line);
      }
    }
  }

  if (currentEntry) {
    entries.set(currentEntry.version, currentEntry);
  }

  return entries;
}
