/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { GetBindingPatternQueuesTopicXControllerRequestPathDTO } from '../../dto/controllers/exchange-topic/GetBindingPatternQueuesTopicXControllerRequestPathDTO.js';
import { GetBindingPatternQueuesTopicXControllerResponseDTO } from '../../dto/controllers/exchange-topic/GetBindingPatternQueuesTopicXControllerResponseDTO.js';
import {
  TControllerRequestHandler,
  TControllerRequestPayloadEmpty,
} from '../../lib/controller/types/index.js';
import { Container } from '../../container/Container.js';

export const getBindingPatternQueuesTopicXController: TControllerRequestHandler<
  GetBindingPatternQueuesTopicXControllerRequestPathDTO,
  TControllerRequestPayloadEmpty,
  TControllerRequestPayloadEmpty,
  GetBindingPatternQueuesTopicXControllerResponseDTO
> = async (ctx) => {
  const service = Container.getInstance().resolve('exchangeTopicService');
  const { ns, topic: name, pattern } = ctx.scope.resolve('requestPathDTO');
  const queues = await service.getBindingPatternQueues({ ns, name }, pattern);
  return [200, queues];
};
