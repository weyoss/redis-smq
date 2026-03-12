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
import { ResumeQueueControllerRequestPathDTO } from '../../dto/controllers/queue-operational-state/ResumeQueueControllerRequestPathDTO.js';
import { ResumeQueueControllerRequestBodyDTO } from '../../dto/controllers/queue-operational-state/ResumeQueueControllerRequestBodyDTO.js';
import { ResumeQueueControllerResponseDTO } from '../../dto/controllers/queue-operational-state/ResumeQueueControllerResponseDTO.js';

export const resumeQueueController: TControllerRequestHandler<
  ResumeQueueControllerRequestPathDTO,
  TControllerRequestPayloadEmpty,
  ResumeQueueControllerRequestBodyDTO,
  ResumeQueueControllerResponseDTO
> = async (ctx) => {
  const service = Container.getInstance().resolve(
    'queueOperationalStateService',
  );
  const queueParams = ctx.scope.resolve('requestPathDTO');
  const options = ctx.scope.resolve('requestBodyDTO');

  const r = await service.resumeQueue(queueParams, options);
  return [200, r];
};
