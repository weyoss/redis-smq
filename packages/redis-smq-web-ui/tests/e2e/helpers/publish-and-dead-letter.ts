/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { IQueueParams } from 'redis-smq';
import { publishAndWaitForEvent } from './redis-smq-runtime.js';

/**
 * Publishes a message to `queue` and drives it to DEAD_LETTERED.
 *
 * The consumer's callback always errors; with `retryThreshold: 0`, the
 * first failure dead-letters the message. `retryDelay: 100` guards
 * against the version-coercion case where `retryThreshold: 0` falls
 * back to the default (3 retries) — dead-letter completes in ~300ms
 * worst-case, well within the 15s deadline.
 *
 * Caller is responsible for ensuring `queue` exists before calling.
 */
export async function publishAndDeadLetter(
  queue: IQueueParams | string,
): Promise<string[]> {
  return publishAndWaitForEvent(
    queue,
    'consumer.messageDeadLettered',
    (_msg, cb) => cb(new Error('forced')),
    (msg) => {
      msg.setRetryThreshold(0).setRetryDelay(100);
    },
  );
}
