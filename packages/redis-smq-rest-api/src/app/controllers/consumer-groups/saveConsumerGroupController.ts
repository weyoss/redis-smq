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
import { SaveConsumerGroupControllerRequestBodyDTO } from '../../dto/controllers/consumer-groups/SaveConsumerGroupControllerRequestBodyDTO.js';
import { SaveConsumerGroupControllerRequestPathDTO } from '../../dto/controllers/consumer-groups/SaveConsumerGroupControllerRequestPathDTO.js';
import { SaveConsumerGroupControllerResponseDTO } from '../../dto/controllers/consumer-groups/SaveConsumerGroupControllerResponseDTO.js';

export const saveConsumerGroupController: TControllerRequestHandler<
  SaveConsumerGroupControllerRequestPathDTO,
  TControllerRequestPayloadEmpty,
  SaveConsumerGroupControllerRequestBodyDTO,
  SaveConsumerGroupControllerResponseDTO
> = async (ctx) => {
  const service = Container.getInstance().resolve('consumerGroupsService');
  const queueParams = ctx.scope.resolve('requestPathDTO');
  const { consumerGroupId } = ctx.scope.resolve('requestBodyDTO');
  await service.saveConsumerGroup(queueParams, consumerGroupId);
  return [204, null];
};
