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
import { ClearQueueRateLimitControllerRequestPathDTO } from '../../dto/controllers/queue-rate-limit/ClearQueueRateLimitControllerRequestPathDTO.js';
import { ClearQueueRateLimitControllerResponseDTO } from '../../dto/controllers/queue-rate-limit/ClearQueueRateLimitControllerResponseDTO.js';

export const clearQueueRateLimitController: TControllerRequestHandler<
  ClearQueueRateLimitControllerRequestPathDTO,
  TControllerRequestPayloadEmpty,
  TControllerRequestPayloadEmpty,
  ClearQueueRateLimitControllerResponseDTO
> = async (ctx) => {
  const queueRateLimitService = Container.getInstance().resolve(
    'queueRateLimitService',
  );
  const dto = ctx.scope.resolve('requestPathDTO');
  await queueRateLimitService.clearRateLimit(dto);
  return [204, null];
};
