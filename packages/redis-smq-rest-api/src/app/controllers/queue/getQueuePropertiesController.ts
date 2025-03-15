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
import { GetQueuePropertiesControllerRequestPathDTO } from '../../dto/controllers/queues/GetQueuePropertiesControllerRequestPathDTO.js';
import { GetQueuePropertiesControllerResponseDTO } from '../../dto/controllers/queues/GetQueuePropertiesControllerResponseDTO.js';

export const getQueuePropertiesController: TControllerRequestHandler<
  GetQueuePropertiesControllerRequestPathDTO,
  TControllerRequestPayloadEmpty,
  TControllerRequestPayloadEmpty,
  GetQueuePropertiesControllerResponseDTO
> = async (ctx) => {
  const queueService = Container.getInstance().resolve('queuesService');
  const queueParams = ctx.scope.resolve('requestPathDTO');
  const r = await queueService.getProperties(queueParams);
  return [200, r];
};
