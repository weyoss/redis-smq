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
import { GetQueueDeadLetteredMessagesControllerRequestPathDTO } from '../../dto/controllers/queue-dead-lettered-messages/GetQueueDeadLetteredMessagesControllerRequestPathDTO.js';
import { GetQueueDeadLetteredMessagesControllerRequestQueryDTO } from '../../dto/controllers/queue-dead-lettered-messages/GetQueueDeadLetteredMessagesControllerRequestQueryDTO.js';
import { GetQueueDeadLetteredMessagesControllerResponseDTO } from '../../dto/controllers/queue-dead-lettered-messages/GetQueueDeadLetteredMessagesControllerResponseDTO.js';

export const getQueueDeadLetteredMessagesController: TControllerRequestHandler<
  GetQueueDeadLetteredMessagesControllerRequestPathDTO,
  GetQueueDeadLetteredMessagesControllerRequestQueryDTO,
  TControllerRequestPayloadEmpty,
  GetQueueDeadLetteredMessagesControllerResponseDTO
> = async (ctx) => {
  const queueDeadLetteredMessagesService = Container.getInstance().resolve(
    'queueDeadLetteredMessagesService',
  );
  const queueParams = ctx.scope.resolve('requestPathDTO');
  const { pageSize, cursor } = ctx.scope.resolve('requestQueryDTO');
  const r = await queueDeadLetteredMessagesService.getMessages(
    queueParams,
    cursor,
    pageSize,
  );
  return [200, r];
};
