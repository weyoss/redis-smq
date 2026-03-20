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
} from '../../../../../../lib/controller/types/index.js';
import { Container } from '../../../../../../container/Container.js';
import { GetQueueRateLimitControllerRequestPathDTO } from './GetQueueRateLimitControllerRequestPathDTO.js';
import { GetQueueRateLimitControllerResponseDTO } from './GetQueueRateLimitControllerResponseDTO.js';

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
