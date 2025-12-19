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
import { CountQueuePendingMessagesControllerRequestPathDTO } from '../../dto/controllers/queue-pending-messages/CountQueuePendingMessagesControllerRequestPathDTO.js';
import { CountQueuePendingMessagesControllerRequestQueryDTO } from '../../dto/controllers/queue-pending-messages/CountQueuePendingMessagesControllerRequestQueryDTO.js';
import { CountQueuePendingMessagesControllerResponseDTO } from '../../dto/controllers/queue-pending-messages/CountQueuePendingMessagesControllerResponseDTO.js';

export const countQueuePendingMessagesController: TControllerRequestHandler<
  CountQueuePendingMessagesControllerRequestPathDTO,
  CountQueuePendingMessagesControllerRequestQueryDTO,
  TControllerRequestPayloadEmpty,
  CountQueuePendingMessagesControllerResponseDTO
> = async (ctx) => {
  const queuePendingMessagesService = Container.getInstance().resolve(
    'queuePendingMessagesService',
  );
  const pathDTO = ctx.scope.resolve('requestPathDTO');
  const queryDTO = ctx.scope.resolve('requestQueryDTO');
  const count = await queuePendingMessagesService.countMessagesAsync(
    pathDTO,
    queryDTO.consumerGroupId,
  );
  return [200, count];
};
