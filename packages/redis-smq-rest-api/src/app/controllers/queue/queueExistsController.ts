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
import { QueueExistsControllerRequestPathDTO } from '../../dto/controllers/queues/QueueExistsControllerRequestPathDTO.js';
import { QueueExistsControllerResponseDTO } from '../../dto/controllers/queues/QueueExistsControllerResponseDTO.js';

export const queueExistsController: TControllerRequestHandler<
  QueueExistsControllerRequestPathDTO,
  TControllerRequestPayloadEmpty,
  TControllerRequestPayloadEmpty,
  QueueExistsControllerResponseDTO
> = async (ctx) => {
  const queueService = Container.getInstance().resolve('queuesService');
  const queueParams = ctx.scope.resolve('requestPathDTO');
  const r = await queueService.exists(queueParams);
  return [200, r];
};
