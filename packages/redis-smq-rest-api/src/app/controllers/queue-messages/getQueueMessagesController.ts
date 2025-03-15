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
import { GetQueueMessagesControllerRequestPathDTO } from '../../dto/controllers/queue-messages/GetQueueMessagesControllerRequestPathDTO.js';
import { GetQueueMessagesControllerRequestQueryDTO } from '../../dto/controllers/queue-messages/GetQueueMessagesControllerRequestQueryDTO.js';
import { GetQueueMessagesControllerResponseDTO } from '../../dto/controllers/queue-messages/GetQueueMessagesControllerResponseDTO.js';
import { QueueMessagesService } from '../../services/QueueMessagesService.js';

export const getQueueMessagesController: TControllerRequestHandler<
  GetQueueMessagesControllerRequestPathDTO,
  GetQueueMessagesControllerRequestQueryDTO,
  TControllerRequestPayloadEmpty,
  GetQueueMessagesControllerResponseDTO
> = async (ctx) => {
  const queueMessagesService =
    Container.getInstance().resolve<QueueMessagesService>(
      'queueMessagesService',
    );
  const queueParams = ctx.scope.resolve('requestPathDTO');
  const { cursor, pageSize } = ctx.scope.resolve('requestQueryDTO');
  const r = await queueMessagesService.getMessages(
    queueParams,
    cursor,
    pageSize,
  );
  return [200, r];
};
