/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IConsolidatedEntry } from './types/index.js';

/**
 * Format a single consolidated changelog entry
 */
export function formatChangelog(
  entry: IConsolidatedEntry,
  options: {
    includeMetadata?: boolean;
    sectionOrder?: string[];
  } = {},
): string {
  const { includeMetadata = true, sectionOrder = [] } = options;
  const output: string[] = [];

  // Add metadata comment (optional)
  if (includeMetadata) {
    output.push(
      `<!-- Generated on ${new Date().toISOString().split('T')[0]} -->`,
    );
    output.push('');
  }

  // Page title with version and date
  output.push(`# RedisSMQ v${entry.version} Release Notes (${entry.date})`);
  output.push('');

  let sectionKeys = Array.from(entry.sections.keys());

  if (sectionOrder.length > 0) {
    const ordered: string[] = [];
    const remaining: string[] = [];

    for (const key of sectionKeys) {
      if (sectionOrder.includes(key)) {
        ordered.push(key);
      } else {
        remaining.push(key);
      }
    }

    ordered.sort((a, b) => {
      return sectionOrder.indexOf(a) - sectionOrder.indexOf(b);
    });

    remaining.sort();

    sectionKeys = [...ordered, ...remaining];
  }

  for (const section of sectionKeys) {
    const changes = entry.sections.get(section)!;
    if (changes.size === 0) continue;

    output.push(`## ${section}`, '');

    const scoped = new Map<string, Set<string>>();
    const unscoped: string[] = [];

    for (const change of changes) {
      const scopeMatch = change.match(/^- \*\*([^*]+)\*\*: (.*)$/);
      if (scopeMatch) {
        const [, scope, message] = scopeMatch;
        if (!scoped.has(scope)) scoped.set(scope, new Set());
        scoped.get(scope)!.add(`- ${message}`);
      } else {
        unscoped.push(change);
      }
    }

    const sortedScopes = Array.from(scoped.keys()).sort();
    for (const scope of sortedScopes) {
      const messages = scoped.get(scope)!;
      output.push(`- **${scope}:**`);
      const sortedMessages = Array.from(messages).sort();
      for (const message of sortedMessages) {
        output.push(message);
      }
    }

    const sortedUnscoped = unscoped.sort();
    for (const change of sortedUnscoped) {
      output.push(change);
    }

    output.push('');
  }

  return output.join('\n');
}
