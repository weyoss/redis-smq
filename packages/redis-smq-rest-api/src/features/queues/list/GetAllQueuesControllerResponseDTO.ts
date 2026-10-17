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
 * Response shape of `GET /api/queues`.
 *
 * Returns every queue across every namespace as a flat array. The
 * endpoint has no pagination — redis-smq's `queueManager.getQueues()`
 * returns the full list, and the current surface mirrors that. If the
 * list ever grows past a manageable size, pagination is a breaking
 * change to the response shape and belongs in a new endpoint version.
 *
 * No error branches: `getQueues()` on a running runtime cannot throw.
 * A future addition of a `QueueNotFoundError` or an authorization
 * error would add branches here and in `list/route.ts`.
 */
export type GetAllQueuesControllerResponseDTO = readonly [200, IQueueParams[]];
