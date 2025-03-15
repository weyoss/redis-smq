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
import { GetQueueAcknowledgedMessagesControllerRequestPathDTO } from '../../dto/controllers/queue-acknowledged-messages/GetQueueAcknowledgedMessagesControllerRequestPathDTO.js';
import { GetQueueAcknowledgedMessagesControllerRequestQueryDTO } from '../../dto/controllers/queue-acknowledged-messages/GetQueueAcknowledgedMessagesControllerRequestQueryDTO.js';
import { GetQueueAcknowledgedMessagesControllerResponseDTO } from '../../dto/controllers/queue-acknowledged-messages/GetQueueAcknowledgedMessagesControllerResponseDTO.js';

export const getQueueAcknowledgedMessagesController: TControllerRequestHandler<
  GetQueueAcknowledgedMessagesControllerRequestPathDTO,
  GetQueueAcknowledgedMessagesControllerRequestQueryDTO,
  TControllerRequestPayloadEmpty,
  GetQueueAcknowledgedMessagesControllerResponseDTO
> = async (ctx) => {
  const queueAcknowledgedMessagesService = Container.getInstance().resolve(
    'queueAcknowledgedMessagesService',
  );
  const queueParams = ctx.scope.resolve('requestPathDTO');
  const { cursor, pageSize } = ctx.scope.resolve('requestQueryDTO');
  const r = await queueAcknowledgedMessagesService.getMessages(
    queueParams,
    cursor,
    pageSize,
  );
  return [200, r];
};
