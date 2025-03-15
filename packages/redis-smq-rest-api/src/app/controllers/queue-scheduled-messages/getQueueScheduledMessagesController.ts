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
import { GetQueueScheduledMessagesControllerRequestPathDTO } from '../../dto/controllers/queue-scheduled-messages/GetQueueScheduledMessagesControllerRequestPathDTO.js';
import { GetQueueScheduledMessagesControllerRequestQueryDTO } from '../../dto/controllers/queue-scheduled-messages/GetQueueScheduledMessagesControllerRequestQueryDTO.js';
import { GetQueueScheduledMessagesControllerResponseDTO } from '../../dto/controllers/queue-scheduled-messages/GetQueueScheduledMessagesControllerResponseDTO.js';

export const getQueueScheduledMessagesController: TControllerRequestHandler<
  GetQueueScheduledMessagesControllerRequestPathDTO,
  GetQueueScheduledMessagesControllerRequestQueryDTO,
  TControllerRequestPayloadEmpty,
  GetQueueScheduledMessagesControllerResponseDTO
> = async (ctx) => {
  const queueScheduledMessagesService = Container.getInstance().resolve(
    'queueScheduledMessagesService',
  );
  const queueParams = ctx.scope.resolve('requestPathDTO');
  const { cursor, pageSize } = ctx.scope.resolve('requestQueryDTO');
  const r = await queueScheduledMessagesService.getMessages(
    queueParams,
    cursor,
    pageSize,
  );
  return [200, r];
};
