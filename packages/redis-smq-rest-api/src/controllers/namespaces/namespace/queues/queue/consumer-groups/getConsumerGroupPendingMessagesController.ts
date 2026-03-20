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
} from '../../../../../../lib/controller/types/index.js';
import { Container } from '../../../../../../container/Container.js';
import { GetConsumerGroupPendingMessagesControllerRequestPathDTO } from './GetConsumerGroupPendingMessagesControllerRequestPathDTO.js';
import { GetConsumerGroupPendingMessagesControllerRequestQueryDTO } from './GetConsumerGroupPendingMessagesControllerRequestQueryDTO.js';
import { GetConsumerGroupPendingMessagesControllerResponseDTO } from './GetConsumerGroupPendingMessagesControllerResponseDTO.js';

export const getConsumerGroupPendingMessagesController: TControllerRequestHandler<
  GetConsumerGroupPendingMessagesControllerRequestPathDTO,
  GetConsumerGroupPendingMessagesControllerRequestQueryDTO,
  TControllerRequestPayloadEmpty,
  GetConsumerGroupPendingMessagesControllerResponseDTO
> = async (ctx) => {
  const service = Container.getInstance().resolve('consumerGroupsService');
  const { consumerGroupId, ...queueParams } =
    ctx.scope.resolve('requestPathDTO');
  const { page, pageSize } = ctx.scope.resolve('requestQueryDTO');
  const r = await service.getPendingMessages(
    queueParams,
    consumerGroupId,
    page,
    pageSize,
  );
  return [200, r];
};
