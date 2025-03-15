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
import { CountQueueAcknowledgedMessagesControllerRequestPathDTO } from '../../dto/controllers/queue-acknowledged-messages/CountQueueAcknowledgedMessagesControllerRequestPathDTO.js';
import { CountQueueAcknowledgedMessagesControllerResponseDTO } from '../../dto/controllers/queue-acknowledged-messages/CountQueueAcknowledgedMessagesControllerResponseDTO.js';

export const countQueueAcknowledgedMessagesController: TControllerRequestHandler<
  CountQueueAcknowledgedMessagesControllerRequestPathDTO,
  TControllerRequestPayloadEmpty,
  TControllerRequestPayloadEmpty,
  CountQueueAcknowledgedMessagesControllerResponseDTO
> = async (ctx) => {
  const queueAcknowledgedMessagesService = Container.getInstance().resolve(
    'queueAcknowledgedMessagesService',
  );
  const dto = ctx.scope.resolve('requestPathDTO');
  const count = await queueAcknowledgedMessagesService.countMessagesAsync(dto);
  return [200, count];
};
