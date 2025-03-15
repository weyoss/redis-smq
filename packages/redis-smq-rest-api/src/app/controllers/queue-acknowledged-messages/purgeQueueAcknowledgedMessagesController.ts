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
import { PurgeQueueAcknowledgedMessagesControllerRequestPathDTO } from '../../dto/controllers/queue-acknowledged-messages/PurgeQueueAcknowledgedMessagesControllerRequestPathDTO.js';
import { PurgeQueueAcknowledgedMessagesControllerResponseDTO } from '../../dto/controllers/queue-acknowledged-messages/PurgeQueueAcknowledgedMessagesControllerResponseDTO.js';

export const purgeQueueAcknowledgedMessagesController: TControllerRequestHandler<
  PurgeQueueAcknowledgedMessagesControllerRequestPathDTO,
  TControllerRequestPayloadEmpty,
  TControllerRequestPayloadEmpty,
  PurgeQueueAcknowledgedMessagesControllerResponseDTO
> = async (ctx) => {
  const queueAcknowledgedMessagesService = Container.getInstance().resolve(
    'queueAcknowledgedMessagesService',
  );
  const dto = ctx.scope.resolve('requestPathDTO');
  await queueAcknowledgedMessagesService.purge(dto);
  return [204, null];
};
