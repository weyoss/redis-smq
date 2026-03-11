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
import { ResumeQueueControllerRequestPathDTO } from '../../dto/controllers/queues/ResumeQueueControllerRequestPathDTO.js';
import { ResumeQueueControllerRequestBodyDTO } from '../../dto/controllers/queues/ResumeQueueControllerRequestBodyDTO.js';
import { ResumeQueueControllerResponseDTO } from '../../dto/controllers/queues/ResumeQueueControllerResponseDTO.js';

export const resumeQueueController: TControllerRequestHandler<
  ResumeQueueControllerRequestPathDTO,
  TControllerRequestPayloadEmpty,
  ResumeQueueControllerRequestBodyDTO,
  ResumeQueueControllerResponseDTO
> = async (ctx) => {
  const queueService = Container.getInstance().resolve('queuesService');
  const queueParams = ctx.scope.resolve('requestPathDTO');
  const options = ctx.scope.resolve('requestBodyDTO');

  const r = await queueService.resumeQueue(queueParams, options);
  return [200, r];
};
