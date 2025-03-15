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
import { GetConsumerGroupsControllerRequestPathDTO } from '../../dto/controllers/consumer-groups/GetConsumerGroupsControllerRequestPathDTO.js';
import { GetConsumerGroupsControllerResponseDTO } from '../../dto/controllers/consumer-groups/GetConsumerGroupsControllerResponseDTO.js';

export const getConsumerGroupsController: TControllerRequestHandler<
  GetConsumerGroupsControllerRequestPathDTO,
  TControllerRequestPayloadEmpty,
  TControllerRequestPayloadEmpty,
  GetConsumerGroupsControllerResponseDTO
> = async (ctx) => {
  const service = Container.getInstance().resolve('consumerGroupsService');
  const queueParams = ctx.scope.resolve('requestPathDTO');
  const consumerGroups = await service.getConsumerGroups(queueParams);
  return [200, consumerGroups];
};
