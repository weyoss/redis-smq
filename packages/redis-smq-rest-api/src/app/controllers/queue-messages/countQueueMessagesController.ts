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
import { CountQueueMessagesControllerRequestPathDTO } from '../../dto/controllers/queue-messages/CountQueueMessagesControllerRequestPathDTO.js';
import { CountQueueMessagesControllerResponseDTO } from '../../dto/controllers/queue-messages/CountQueueMessagesControllerResponseDTO.js';

export const countQueueMessagesController: TControllerRequestHandler<
  CountQueueMessagesControllerRequestPathDTO,
  TControllerRequestPayloadEmpty,
  TControllerRequestPayloadEmpty,
  CountQueueMessagesControllerResponseDTO
> = async (ctx) => {
  const queueMessagesService = Container.getInstance().resolve(
    'queueMessagesService',
  );
  const dto = ctx.scope.resolve('requestPathDTO');
  const count = await queueMessagesService.countMessagesAsync(dto);
  return [200, count];
};
