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
import { CountQueueMessagesByStatusControllerResponseDTO } from '../../dto/controllers/queue-messages/CountQueueMessagesByStatusControllerResponseDTO.js';
import { CountQueueScheduledMessagesControllerRequestPathDTO } from '../../dto/controllers/queue-scheduled-messages/CountQueueScheduledMessagesControllerRequestPathDTO.js';

export const countQueueMessagesByStatusController: TControllerRequestHandler<
  CountQueueScheduledMessagesControllerRequestPathDTO,
  TControllerRequestPayloadEmpty,
  TControllerRequestPayloadEmpty,
  CountQueueMessagesByStatusControllerResponseDTO
> = async (ctx) => {
  const queueMessagesService = Container.getInstance().resolve(
    'queueMessagesService',
  );
  const dto = ctx.scope.resolve('requestPathDTO');
  const count = await queueMessagesService.countMessagesByStatus(dto);
  return [200, count];
};
