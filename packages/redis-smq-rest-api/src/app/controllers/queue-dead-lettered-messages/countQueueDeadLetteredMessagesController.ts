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
import { CountQueueDeadLetteredMessagesControllerRequestPathDTO } from '../../dto/controllers/queue-dead-lettered-messages/CountQueueDeadLetteredMessagesControllerRequestPathDTO.js';
import { CountQueueDeadLetteredMessagesControllerResponseDTO } from '../../dto/controllers/queue-dead-lettered-messages/CountQueueDeadLetteredMessagesControllerResponseDTO.js';

export const countQueueDeadLetteredMessagesController: TControllerRequestHandler<
  CountQueueDeadLetteredMessagesControllerRequestPathDTO,
  TControllerRequestPayloadEmpty,
  TControllerRequestPayloadEmpty,
  CountQueueDeadLetteredMessagesControllerResponseDTO
> = async (ctx) => {
  const queueDeadLetteredMessagesService = Container.getInstance().resolve(
    'queueDeadLetteredMessagesService',
  );
  const dto = ctx.scope.resolve('requestPathDTO');
  const count = await queueDeadLetteredMessagesService.countMessagesAsync(dto);
  return [200, count];
};
