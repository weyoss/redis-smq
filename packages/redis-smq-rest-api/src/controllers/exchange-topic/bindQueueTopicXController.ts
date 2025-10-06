/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { BindQueueTopicXControllerRequestPathDTO } from '../../dto/controllers/exchange-topic/BindQueueTopicXControllerRequestPathDTO.js';
import { BindQueueTopicXControllerRequestQueryDTO } from '../../dto/controllers/exchange-topic/BindQueueTopicXControllerRequestQueryDTO.js';
import { BindQueueTopicXControllerResponseDTO } from '../../dto/controllers/exchange-topic/BindQueueTopicXControllerResponseDTO.js';
import {
  TControllerRequestHandler,
  TControllerRequestPayloadEmpty,
} from '../../lib/controller/types/index.js';
import { Container } from '../../container/Container.js';

export const bindQueueTopicXController: TControllerRequestHandler<
  BindQueueTopicXControllerRequestPathDTO,
  BindQueueTopicXControllerRequestQueryDTO,
  TControllerRequestPayloadEmpty,
  BindQueueTopicXControllerResponseDTO
> = async (ctx) => {
  const service = Container.getInstance().resolve('exchangeTopicService');
  const { ns, topic, queue } = ctx.scope.resolve('requestPathDTO');
  const { bindingPattern } = ctx.scope.resolve('requestQueryDTO');
  await service.bindQueue(
    { ns, name: queue },
    { ns, name: topic },
    bindingPattern,
  );
  return [204, null];
};
