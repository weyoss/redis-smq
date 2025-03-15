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
import { PurgeConsumerGroupPendingMessagesControllerRequestPathDTO } from '../../dto/controllers/consumer-groups/PurgeConsumerGroupPendingMessagesControllerRequestPathDTO.js';
import { PurgeConsumerGroupPendingMessagesControllerResponseDTO } from '../../dto/controllers/consumer-groups/PurgeConsumerGroupPendingMessagesControllerResponseDTO.js';

export const purgeConsumerGroupPendingMessagesController: TControllerRequestHandler<
  PurgeConsumerGroupPendingMessagesControllerRequestPathDTO,
  TControllerRequestPayloadEmpty,
  TControllerRequestPayloadEmpty,
  PurgeConsumerGroupPendingMessagesControllerResponseDTO
> = async (ctx) => {
  const service = Container.getInstance().resolve('consumerGroupsService');
  const { consumerGroupId, ...queueParams } =
    ctx.scope.resolve('requestPathDTO');
  await service.purgePendingMessages(queueParams, consumerGroupId);
  return [204, null];
};
