/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { ExchangeRef, QueueRef, apiClient } from './api.js';

/**
 * Purge all messages from the queue (published → every status), then
 * delete it. Both steps are best-effort — a queue that still has active
 * consumers or bindings will reject deletion with 412/403; the next test
 * uses a unique name so a stuck queue doesn't cascade.
 */
export async function cleanupQueue(
  api: ReturnType<typeof apiClient>,
  queue: QueueRef,
): Promise<void> {
  try {
    await api.purgeAllMessages(queue);
  } catch {
    // Queue may not exist or may reject purge — ignore.
  }
  try {
    await api.deleteQueue(queue);
  } catch {
    // Queue may still have bindings or consumers — ignore.
  }
}

/**
 * Delete an exchange. Fails if bindings remain; the caller's `queue`
 * fixture teardown handles those in the reverse order Playwright runs
 * fixtures.
 */
export async function cleanupExchange(
  api: ReturnType<typeof apiClient>,
  exchange: ExchangeRef,
): Promise<void> {
  try {
    await api.deleteExchange(exchange);
  } catch {
    // Exchange may already be gone or still have bindings — ignore.
  }
}
