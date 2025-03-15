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
import { GetQueueRateLimitControllerRequestPathDTO } from '../../dto/controllers/queue-rate-limit/GetQueueRateLimitControllerRequestPathDTO.js';
import { GetQueueRateLimitControllerResponseDTO } from '../../dto/controllers/queue-rate-limit/GetQueueRateLimitControllerResponseDTO.js';

export const getQueueRateLimitController: TControllerRequestHandler<
  GetQueueRateLimitControllerRequestPathDTO,
  TControllerRequestPayloadEmpty,
  TControllerRequestPayloadEmpty,
  GetQueueRateLimitControllerResponseDTO
> = async (ctx) => {
  const queueRateLimitService = Container.getInstance().resolve(
    'queueRateLimitService',
  );
  const queueParams = ctx.scope.resolve('requestPathDTO');
  const r = await queueRateLimitService.getRateLimit(queueParams);
  return [200, r];
};
