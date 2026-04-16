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
} from '../../../../../../lib/types/controller.js';
import { Container } from '../../../../../../container/Container.js';
import { CountConsumerGroupPendingMessagesControllerRequestPathDTO } from './CountConsumerGroupPendingMessagesControllerRequestPathDTO.js';
import { CountConsumerGroupPendingMessagesControllerResponseDTO } from './CountConsumerGroupPendingMessagesControllerResponseDTO.js';

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
