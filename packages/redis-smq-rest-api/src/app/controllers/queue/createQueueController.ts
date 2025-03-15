/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  TControllerRequestHandler,
  TControllerRequestPayloadEmpty,
} from '../../../lib/controller/types/index.js';
import { Container } from '../../container/Container.js';
import { CreateQueueControllerRequestBodyDTO } from '../../dto/controllers/queues/CreateQueueControllerRequestBodyDTO.js';
import { CreateQueueControllerResponseDTO } from '../../dto/controllers/queues/CreateQueueControllerResponseDTO.js';

export const createQueueController: TControllerRequestHandler<
  TControllerRequestPayloadEmpty,
  TControllerRequestPayloadEmpty,
  CreateQueueControllerRequestBodyDTO,
  CreateQueueControllerResponseDTO
> = async (ctx) => {
  const queueService = Container.getInstance().resolve('queuesService');
  const { queue, queueType, queueDeliveryModel } =
    ctx.scope.resolve('requestBodyDTO');
  const r = await queueService.createQueue(
    queue,
    queueType,
    queueDeliveryModel,
  );
  return [201, r];
};
