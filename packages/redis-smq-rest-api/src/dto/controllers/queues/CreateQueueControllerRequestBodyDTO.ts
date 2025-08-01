/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { EQueueDeliveryModel, EQueueType, IQueueParams } from 'redis-smq';

export type CreateQueueControllerRequestBodyDTO = {
  queue: IQueueParams;
  queueType: EQueueType;
  queueDeliveryModel: EQueueDeliveryModel;
};
