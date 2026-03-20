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
import { CheckQueueExistenceControllerRequestPathDTO } from './CheckQueueExistenceControllerRequestPathDTO.js';
import { CheckQueueExistenceControllerResponseDTO } from './CheckQueueExistenceControllerResponseDTO.js';
import { errors } from 'redis-smq';

export const checkQueueExistenceController: TControllerRequestHandler<
  CheckQueueExistenceControllerRequestPathDTO,
  TControllerRequestPayloadEmpty,
  TControllerRequestPayloadEmpty,
  CheckQueueExistenceControllerResponseDTO
> = async (ctx) => {
  const queueService = Container.getInstance().resolve('queuesService');
  const queueParams = ctx.scope.resolve('requestPathDTO');
  const r = await queueService.exists(queueParams);
  if (!r) {
    throw new errors.QueueNotFoundError({
      metadata: {
        queue: queueParams,
      },
    });
  }
  return [200, null];
};
