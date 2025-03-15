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
import { SetQueueRateLimitControllerRequestBodyDTO } from '../../dto/controllers/queue-rate-limit/SetQueueRateLimitControllerRequestBodyDTO.js';
import { SetQueueRateLimitControllerRequestPathDTO } from '../../dto/controllers/queue-rate-limit/SetQueueRateLimitControllerRequestPathDTO.js';
import { SetQueueRateLimitControllerResponseDTO } from '../../dto/controllers/queue-rate-limit/SetQueueRateLimitControllerResponseDTO.js';

export const setQueueRateLimitController: TControllerRequestHandler<
  SetQueueRateLimitControllerRequestPathDTO,
  TControllerRequestPayloadEmpty,
  SetQueueRateLimitControllerRequestBodyDTO,
  SetQueueRateLimitControllerResponseDTO
> = async (ctx) => {
  const queueRateLimitService = Container.getInstance().resolve(
    'queueRateLimitService',
  );
  const queueParams = ctx.scope.resolve('requestPathDTO');
  const rateLimit = ctx.scope.resolve('requestBodyDTO');

  const r = await queueRateLimitService.setRateLimit(queueParams, rateLimit);
  return [200, r];
};
