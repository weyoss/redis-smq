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
} from '../../../../../../lib/types/controller.js';
import { Container } from '../../../../../../container/Container.js';
import { SetQueueRateLimitControllerRequestBodyDTO } from './SetQueueRateLimitControllerRequestBodyDTO.js';
import { SetQueueRateLimitControllerRequestPathDTO } from './SetQueueRateLimitControllerRequestPathDTO.js';
import { SetQueueRateLimitControllerResponseDTO } from './SetQueueRateLimitControllerResponseDTO.js';

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
