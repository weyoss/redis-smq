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
import { DeleteQueueControllerRequestPathDTO } from '../../dto/controllers/queues/DeleteQueueControllerRequestPathDTO.js';
import { DeleteQueueControllerResponseDTO } from '../../dto/controllers/queues/DeleteQueueControllerResponseDTO.js';

export const deleteQueueController: TControllerRequestHandler<
  DeleteQueueControllerRequestPathDTO,
  TControllerRequestPayloadEmpty,
  TControllerRequestPayloadEmpty,
  DeleteQueueControllerResponseDTO
> = async (ctx) => {
  const queueService = Container.getInstance().resolve('queuesService');
  const queueParams = ctx.scope.resolve('requestPathDTO');
  await queueService.delete(queueParams);
  return [204, null];
};
