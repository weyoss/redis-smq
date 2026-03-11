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
import { PauseQueueControllerRequestPathDTO } from '../../dto/controllers/queues/PauseQueueControllerRequestPathDTO.js';
import { PauseQueueControllerResponseDTO } from '../../dto/controllers/queues/PauseQueueControllerResponseDTO.js';
import { PauseQueueControllerRequestBodyDTO } from '../../dto/controllers/queues/PauseQueueControllerRequestBodyDTO.js';

export const pauseQueueController: TControllerRequestHandler<
  PauseQueueControllerRequestPathDTO,
  TControllerRequestPayloadEmpty,
  PauseQueueControllerRequestBodyDTO,
  PauseQueueControllerResponseDTO
> = async (ctx) => {
  const queueService = Container.getInstance().resolve('queuesService');
  const queueParams = ctx.scope.resolve('requestPathDTO');
  const options = ctx.scope.resolve('requestBodyDTO');

  const r = await queueService.pauseQueue(queueParams, options);
  return [200, r];
};
