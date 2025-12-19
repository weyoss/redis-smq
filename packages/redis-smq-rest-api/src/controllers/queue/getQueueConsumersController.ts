/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  TControllerRequestHandler,
  TControllerRequestPayloadEmpty,
} from '../../lib/controller/types/index.js';
import { Container } from '../../container/Container.js';
import { GetQueueConsumersControllerRequestPathDTO } from '../../dto/controllers/queues/GetQueueConsumersControllerRequestPathDTO.js';
import { GetQueueConsumersControllerResponseDTO } from '../../dto/controllers/queues/GetQueueConsumersControllerResponseDTO.js';

export const getQueueConsumersController: TControllerRequestHandler<
  GetQueueConsumersControllerRequestPathDTO,
  TControllerRequestPayloadEmpty,
  TControllerRequestPayloadEmpty,
  GetQueueConsumersControllerResponseDTO
> = async (ctx) => {
  const queueService = Container.getInstance().resolve('queuesService');
  const queueParams = ctx.scope.resolve('requestPathDTO');
  const r = await queueService.getConsumers(queueParams);
  return [200, r];
};
