/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { IQueueParams } from 'redis-smq';

/**
 * Extracts `{ ns, name }` from a path DTO that also carries
 * `consumerGroupId`.
 *
 * Four of the six handlers in this folder accept a path DTO shaped
 * `{ ns, name, consumerGroupId }`. The `consumerGroupId` is used
 * separately; the queue params go to the consumer-groups manager.
 * This helper builds the queue object once so the handlers don't
 * repeat the destructure.
 *
 * Not imported by any DTO. It has no `redis-smq` runtime imports —
 * `IQueueParams` is a type-only import that erases at compile time —
 * so it's safe to reference from DTO files if the need ever arises.
 * Today only handlers import it.
 */
export function pathToQueue(path: { ns: string; name: string }): IQueueParams {
  return { ns: path.ns, name: path.name };
}
