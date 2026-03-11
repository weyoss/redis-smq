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
import { StopQueueControllerRequestPathDTO } from '../../dto/controllers/queues/StopQueueControllerRequestPathDTO.js';
import { StopQueueControllerRequestBodyDTO } from '../../dto/controllers/queues/StopQueueControllerRequestBodyDTO.js';
import { StopQueueControllerResponseDTO } from '../../dto/controllers/queues/StopQueueControllerResponseDTO.js';

export const stopQueueController: TControllerRequestHandler<
  StopQueueControllerRequestPathDTO,
  TControllerRequestPayloadEmpty,
  StopQueueControllerRequestBodyDTO,
  StopQueueControllerResponseDTO
> = async (ctx) => {
  const queueService = Container.getInstance().resolve('queuesService');
  const queueParams = ctx.scope.resolve('requestPathDTO');
  const options = ctx.scope.resolve('requestBodyDTO');

  const r = await queueService.stopQueue(queueParams, options);
  return [200, r];
};
