/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

/**
 * Read and poll a PUB_SUB queue's registered consumer groups.
 *
 * `getGroupIds(queue)` reads the queue's group list through the
 * framework's `IConsumerGroupsManager` and returns the current IDs.
 * `waitForGroupIds(queue, predicate, description)` polls that list
 * until `predicate` returns true, failing with a specific description
 * on timeout.
 */

import { type IQueueParams, RedisSMQ } from '../../../src/index.js';
import { waitFor } from '../assertions/wait-for.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Default polling timeout for `waitForGroupIds`.
 *
 * The operations that change a group list — `saveConsumerGroup`,
 * ephemeral-group cleanup, `deleteConsumerGroup` — each involve one or
 * two Redis round-trips and are therefore fast on a healthy
 * connection. 5 seconds matches the constant the four local copies
 * used uniformly: long enough to absorb CI jitter, short enough that a
 * genuinely stuck group list fails within a test-friendly window.
 */
const DEFAULT_GROUP_WAIT_TIMEOUT_MS = 5000;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Read the queue's registered consumer group IDs.
 *
 * RedisSMQ does not document a return order, so callers that
 * compare the list against a known set should sort it (or convert to a
 * `Set`) before asserting. The helpers below do not sort — the
 * predicate form lets each caller decide whether order matters for its
 * comparison.
 */
export async function getGroupIds(queue: IQueueParams): Promise<string[]> {
  return RedisSMQ.createConsumerGroupsManager().getConsumerGroups(queue);
}

/**
 * Poll until the queue's group list satisfies `predicate`, or fail
 * with `description` after the timeout.
 *
 * The `description` argument is required — every call site in the
 * suite passes a specific message naming the operation being awaited
 * ("ephemeral group … present before cancel", "both ephemeral groups
 * removed", etc.). A generic default would be less useful than the
 * specific string each call site already writes, so the parameter is
 * not optional.
 *
 * The default timeout is `DEFAULT_GROUP_WAIT_TIMEOUT_MS`; callers
 * whose operation is expected to take longer pass their own via the
 * optional fourth parameter.
 */
export async function waitForGroupIds(
  queue: IQueueParams,
  predicate: (groups: string[]) => boolean,
  description: string,
  timeoutMs = DEFAULT_GROUP_WAIT_TIMEOUT_MS,
): Promise<void> {
  await waitFor(async () => predicate(await getGroupIds(queue)), {
    timeoutMs,
    description,
  });
}
