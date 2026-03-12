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
import { StopQueueControllerRequestPathDTO } from '../../dto/controllers/queue-operational-state/StopQueueControllerRequestPathDTO.js';
import { StopQueueControllerRequestBodyDTO } from '../../dto/controllers/queue-operational-state/StopQueueControllerRequestBodyDTO.js';
import { StopQueueControllerResponseDTO } from '../../dto/controllers/queue-operational-state/StopQueueControllerResponseDTO.js';

export const stopQueueController: TControllerRequestHandler<
  StopQueueControllerRequestPathDTO,
  TControllerRequestPayloadEmpty,
  StopQueueControllerRequestBodyDTO,
  StopQueueControllerResponseDTO
> = async (ctx) => {
  const service = Container.getInstance().resolve(
    'queueOperationalStateService',
  );
  const queueParams = ctx.scope.resolve('requestPathDTO');
  const options = ctx.scope.resolve('requestBodyDTO');

  const r = await service.stopQueue(queueParams, options);
  return [200, r];
};
