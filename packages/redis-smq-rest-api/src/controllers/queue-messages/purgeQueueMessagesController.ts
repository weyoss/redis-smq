/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  TControllerRequestHandler,
  TControllerRequestPayloadEmpty,
} from '../../lib/controller/types/index.js';
import { Container } from '../../container/Container.js';
import { PurgeQueueMessagesControllerRequestPathDTO } from '../../dto/controllers/queue-messages/PurgeQueueMessagesControllerRequestPathDTO.js';
import { PurgeQueueMessagesControllerRequestQueryDTO } from '../../dto/controllers/queue-messages/PurgeQueueMessagesControllerRequestQueryDTO.js';
import { PurgeQueueMessagesControllerResponseDTO } from '../../dto/controllers/queue-messages/PurgeQueueMessagesControllerResponseDTO.js';

export const purgeQueueMessagesController: TControllerRequestHandler<
  PurgeQueueMessagesControllerRequestPathDTO,
  PurgeQueueMessagesControllerRequestQueryDTO,
  TControllerRequestPayloadEmpty,
  PurgeQueueMessagesControllerResponseDTO
> = async (ctx) => {
  const service = Container.getInstance().resolve('queueMessagesService');
  const queueParams = ctx.scope.resolve('requestPathDTO');
  const queryParams = ctx.scope.resolve('requestQueryDTO');

  await service.purge(queueParams, queryParams);
  return [204, null];
};
