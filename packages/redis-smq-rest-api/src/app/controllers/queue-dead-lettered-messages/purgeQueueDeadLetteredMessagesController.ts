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
import { PurgeQueueDeadLetteredMessagesControllerRequestPathDTO } from '../../dto/controllers/queue-dead-lettered-messages/PurgeQueueDeadLetteredMessagesControllerRequestPathDTO.js';
import { PurgeQueueDeadLetteredMessagesControllerResponseDTO } from '../../dto/controllers/queue-dead-lettered-messages/PurgeQueueDeadLetteredMessagesControllerResponseDTO.js';

export const purgeQueueDeadLetteredMessagesController: TControllerRequestHandler<
  PurgeQueueDeadLetteredMessagesControllerRequestPathDTO,
  TControllerRequestPayloadEmpty,
  TControllerRequestPayloadEmpty,
  PurgeQueueDeadLetteredMessagesControllerResponseDTO
> = async (ctx) => {
  const queueDeadLetteredMessagesService = Container.getInstance().resolve(
    'queueDeadLetteredMessagesService',
  );
  const dto = ctx.scope.resolve('requestPathDTO');
  await queueDeadLetteredMessagesService.purge(dto);
  return [204, null];
};
