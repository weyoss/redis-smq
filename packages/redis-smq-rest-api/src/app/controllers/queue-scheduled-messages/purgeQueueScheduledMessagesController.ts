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
import { PurgeQueueScheduledMessagesControllerRequestPathDTO } from '../../dto/controllers/queue-scheduled-messages/PurgeQueueScheduledMessagesControllerRequestPathDTO.js';
import { PurgeQueueScheduledMessagesControllerResponseDTO } from '../../dto/controllers/queue-scheduled-messages/PurgeQueueScheduledMessagesControllerResponseDTO.js';

export const purgeQueueScheduledMessagesController: TControllerRequestHandler<
  PurgeQueueScheduledMessagesControllerRequestPathDTO,
  TControllerRequestPayloadEmpty,
  TControllerRequestPayloadEmpty,
  PurgeQueueScheduledMessagesControllerResponseDTO
> = async (ctx) => {
  const queueScheduledMessagesService = Container.getInstance().resolve(
    'queueScheduledMessagesService',
  );
  const dto = ctx.scope.resolve('requestPathDTO');
  await queueScheduledMessagesService.purge(dto);
  return [204, null];
};
