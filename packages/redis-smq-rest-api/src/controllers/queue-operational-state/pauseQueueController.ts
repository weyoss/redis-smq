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
import { PauseQueueControllerRequestPathDTO } from '../../dto/controllers/queue-operational-state/PauseQueueControllerRequestPathDTO.js';
import { PauseQueueControllerResponseDTO } from '../../dto/controllers/queue-operational-state/PauseQueueControllerResponseDTO.js';
import { PauseQueueControllerRequestBodyDTO } from '../../dto/controllers/queue-operational-state/PauseQueueControllerRequestBodyDTO.js';

export const pauseQueueController: TControllerRequestHandler<
  PauseQueueControllerRequestPathDTO,
  TControllerRequestPayloadEmpty,
  PauseQueueControllerRequestBodyDTO,
  PauseQueueControllerResponseDTO
> = async (ctx) => {
  const service = Container.getInstance().resolve(
    'queueOperationalStateService',
  );
  const queueParams = ctx.scope.resolve('requestPathDTO');
  const options = ctx.scope.resolve('requestBodyDTO');

  const r = await service.pauseQueue(queueParams, options);
  return [200, r];
};
