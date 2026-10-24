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
 * Publishes a message to `queue` and drives it to ACKNOWLEDGED.
 *
 * The consumer's callback succeeds (`cb()`) on the first delivery, so
 * no retries occur and the message is acknowledged immediately.
 *
 * Requires `messageAudit.acknowledgedMessages.enabled = true` on the
 * server — set by `global-setup.ts` (`enableAuditFeatures`). Without
 * it, `GET ?status=acknowledged` returns 412 and the message can't be
 * browsed, which is what the tests need to requeue it.
 *
 * Caller is responsible for ensuring `queue` exists before calling.
 */
export async function publishAndAcknowledge(
  queue: IQueueParams | string,
): Promise<string[]> {
  return publishAndWaitForEvent(
    queue,
    'consumer.messageAcknowledged',
    (_msg, cb) => cb(),
  );
}
