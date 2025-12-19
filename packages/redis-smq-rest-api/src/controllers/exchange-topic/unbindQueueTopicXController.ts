/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { UnbindQueueTopicXControllerRequestPathDTO } from '../../dto/controllers/exchange-topic/UnbindQueueTopicXControllerRequestPathDTO.js';
import { UnbindQueueTopicXControllerRequestQueryDTO } from '../../dto/controllers/exchange-topic/UnbindQueueTopicXControllerRequestQueryDTO.js';
import { UnbindQueueTopicXControllerResponseDTO } from '../../dto/controllers/exchange-topic/UnbindQueueTopicXControllerResponseDTO.js';
import {
  TControllerRequestHandler,
  TControllerRequestPayloadEmpty,
} from '../../lib/controller/types/index.js';
import { Container } from '../../container/Container.js';

export const unbindQueueTopicXController: TControllerRequestHandler<
  UnbindQueueTopicXControllerRequestPathDTO,
  UnbindQueueTopicXControllerRequestQueryDTO,
  TControllerRequestPayloadEmpty,
  UnbindQueueTopicXControllerResponseDTO
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
