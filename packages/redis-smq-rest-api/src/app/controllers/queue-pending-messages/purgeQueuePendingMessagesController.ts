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
import { PurgeQueuePendingMessagesControllerRequestPathDTO } from '../../dto/controllers/queue-pending-messages/PurgeQueuePendingMessagesControllerRequestPathDTO.js';
import { PurgeQueuePendingMessagesControllerResponseDTO } from '../../dto/controllers/queue-pending-messages/PurgeQueuePendingMessagesControllerResponseDTO.js';

export const purgeQueuePendingMessagesController: TControllerRequestHandler<
  PurgeQueuePendingMessagesControllerRequestPathDTO,
  TControllerRequestPayloadEmpty,
  TControllerRequestPayloadEmpty,
  PurgeQueuePendingMessagesControllerResponseDTO
> = async (ctx) => {
  const queuePendingMessagesService = Container.getInstance().resolve(
    'queuePendingMessagesService',
  );
  const dto = ctx.scope.resolve('requestPathDTO');
  await queuePendingMessagesService.purge(dto);
  return [204, null];
};
