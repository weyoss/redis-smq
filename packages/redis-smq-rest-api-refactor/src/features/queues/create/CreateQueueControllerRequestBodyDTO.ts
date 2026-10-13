/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { EQueueDeliveryModel, EQueueType, IQueueParams } from 'redis-smq';

/**
 * Request body of `POST /api/queues`.
 *
 * Shape copied verbatim from the original package — no redesign, no
 * field renames. Existing clients that post this body continue to
 * work unchanged.
 *
 * `queue` is `IQueueParams` (`{ ns, name }`). `queueType` and
 * `queueDeliveryModel` are the enum values `redis-smq` exports. The
 * generated schema emits them as enums, so AJV rejects numeric
 * strings or made-up values before the handler runs.
 */
export type CreateQueueControllerRequestBodyDTO = {
  queue: IQueueParams;
  queueType: EQueueType;
  queueDeliveryModel: EQueueDeliveryModel;
};
