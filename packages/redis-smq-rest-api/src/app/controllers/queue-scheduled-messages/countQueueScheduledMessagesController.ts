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
import { CountQueueScheduledMessagesControllerRequestPathDTO } from '../../dto/controllers/queue-scheduled-messages/CountQueueScheduledMessagesControllerRequestPathDTO.js';
import { CountQueueScheduledMessagesControllerResponseDTO } from '../../dto/controllers/queue-scheduled-messages/CountQueueScheduledMessagesControllerResponseDTO.js';

export const countQueueScheduledMessagesController: TControllerRequestHandler<
  CountQueueScheduledMessagesControllerRequestPathDTO,
  TControllerRequestPayloadEmpty,
  TControllerRequestPayloadEmpty,
  CountQueueScheduledMessagesControllerResponseDTO
> = async (ctx) => {
  const queueScheduledMessagesService = Container.getInstance().resolve(
    'queueScheduledMessagesService',
  );
  const dto = ctx.scope.resolve('requestPathDTO');
  const count = await queueScheduledMessagesService.countMessagesAsync(dto);
  return [200, count];
};
