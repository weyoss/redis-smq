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
import { CountConsumerGroupPendingMessagesControllerRequestPathDTO } from '../../dto/controllers/consumer-groups/CountConsumerGroupPendingMessagesControllerRequestPathDTO.js';
import { CountConsumerGroupPendingMessagesControllerResponseDTO } from '../../dto/controllers/consumer-groups/CountConsumerGroupPendingMessagesControllerResponseDTO.js';

export const countConsumerGroupPendingMessagesController: TControllerRequestHandler<
  CountConsumerGroupPendingMessagesControllerRequestPathDTO,
  TControllerRequestPayloadEmpty,
  TControllerRequestPayloadEmpty,
  CountConsumerGroupPendingMessagesControllerResponseDTO
> = async (ctx) => {
  const service = Container.getInstance().resolve('consumerGroupsService');
  const { consumerGroupId, ...queueParams } =
    ctx.scope.resolve('requestPathDTO');
  const r = await service.countPendingMessages(queueParams, consumerGroupId);
  return [200, r];
};
