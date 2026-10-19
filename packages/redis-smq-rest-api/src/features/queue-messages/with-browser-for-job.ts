/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { errors } from 'redis-smq';
import type { Deps } from '../../deps/index.js';
import { selectMessageBrowser } from './message-browser.js';
import type { MessageStatus } from './MessageStatus.js';

/**
 * Runs `fn` against the message browser that owns a purge job.
 *
 * If the search falls through every category without finding the job,
 * this function throws `InvalidPurgeQueueJobIdError`. That class
 * requires `metadata: { jobId: string }` — the field is part of its
 * declared metadata shape. Passing `jobId` explicitly means the final
 * error carries the actual ID that was searched for, not a placeholder
 * reconstructed from a closure or a caught error.
 *
 * Without `status`, the caller doesn't know which of the five message
 * categories owns the job. The loop tries each category in turn —
 * `InvalidPurgeQueueJobIdError` means "this category doesn't have this
 * job," so the loop continues. Any other error propagates immediately
 * (a genuine failure, not a wrong-category miss).
 *
 * With `status`, the loop is skipped — a single call against the named
 * category, one Redis read instead of up to five.
 */
export async function withBrowserForJob<T>(
  deps: Deps,
  jobId: string,
  status: MessageStatus | undefined,
  fn: (browser: ReturnType<typeof selectMessageBrowser>) => Promise<T>,
): Promise<T> {
  if (status) {
    const browser = selectMessageBrowser(deps, status);
    return fn(browser);
  }

  const categories: MessageStatus[] = [
    'pending',
    'acknowledged',
    'dead-lettered',
    'scheduled',
    'published',
  ];

  for (let i = 0; i < categories.length; i += 1) {
    const browser = selectMessageBrowser(deps, categories[i]);
    try {
      return await fn(browser);
    } catch (err) {
      if (!(err instanceof errors.InvalidPurgeQueueJobIdError)) {
        throw err;
      }
      // Try the next category.
    }
  }

  throw new errors.InvalidPurgeQueueJobIdError({
    metadata: { jobId },
  });
}
