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
import { GetQueuePendingMessagesControllerRequestPathDTO } from '../../dto/controllers/queue-pending-messages/GetQueuePendingMessagesControllerRequestPathDTO.js';
import { GetQueuePendingMessagesControllerRequestQueryDTO } from '../../dto/controllers/queue-pending-messages/GetQueuePendingMessagesControllerRequestQueryDTO.js';
import { GetQueuePendingMessagesControllerResponseDTO } from '../../dto/controllers/queue-pending-messages/GetQueuePendingMessagesControllerResponseDTO.js';

export const getQueuePendingMessagesController: TControllerRequestHandler<
  GetQueuePendingMessagesControllerRequestPathDTO,
  GetQueuePendingMessagesControllerRequestQueryDTO,
  TControllerRequestPayloadEmpty,
  GetQueuePendingMessagesControllerResponseDTO
> = async (ctx) => {
  const queuePendingMessagesService = Container.getInstance().resolve(
    'queuePendingMessagesService',
  );
  const queueParams = ctx.scope.resolve('requestPathDTO');
  const { cursor, pageSize } = ctx.scope.resolve('requestQueryDTO');
  const r = await queuePendingMessagesService.getMessages(
    queueParams,
    cursor,
    pageSize,
  );
  return [200, r];
};
