/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { MatchQueuesTopicXControllerRequestPathDTO } from '../../dto/controllers/exchange-topic/MatchQueuesTopicXControllerRequestPathDTO.js';
import { MatchQueuesTopicXControllerRequestQueryDTO } from '../../dto/controllers/exchange-topic/MatchQueuesTopicXControllerRequestQueryDTO.js';
import { MatchQueuesTopicXControllerResponseDTO } from '../../dto/controllers/exchange-topic/MatchQueuesTopicXControllerResponseDTO.js';
import {
  TControllerRequestHandler,
  TControllerRequestPayloadEmpty,
} from '../../lib/controller/types/index.js';
import { Container } from '../../container/Container.js';

export const matchQueuesTopicXController: TControllerRequestHandler<
  MatchQueuesTopicXControllerRequestPathDTO,
  MatchQueuesTopicXControllerRequestQueryDTO,
  TControllerRequestPayloadEmpty,
  MatchQueuesTopicXControllerResponseDTO
> = async (ctx) => {
  const service = Container.getInstance().resolve('exchangeTopicService');
  const { ns, topic: name } = ctx.scope.resolve('requestPathDTO');
  const { bindingPattern } = ctx.scope.resolve('requestQueryDTO');
  const queues = await service.matchQueues({ ns, name }, bindingPattern);
  return [200, queues];
};
