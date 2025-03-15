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
import { DeleteConsumerGroupControllerRequestPathDTO } from '../../dto/controllers/consumer-groups/DeleteConsumerGroupControllerRequestPathDTO.js';
import { DeleteConsumerGroupControllerResponseDTO } from '../../dto/controllers/consumer-groups/DeleteConsumerGroupControllerResponseDTO.js';

export const deleteConsumerGroupController: TControllerRequestHandler<
  DeleteConsumerGroupControllerRequestPathDTO,
  TControllerRequestPayloadEmpty,
  TControllerRequestPayloadEmpty,
  DeleteConsumerGroupControllerResponseDTO
> = async (ctx) => {
  const service = Container.getInstance().resolve('consumerGroupsService');
  const { consumerGroupId, ...queueParams } =
    ctx.scope.resolve('requestPathDTO');
  await service.deleteConsumerGroup(queueParams, consumerGroupId);
  return [204, null];
};
