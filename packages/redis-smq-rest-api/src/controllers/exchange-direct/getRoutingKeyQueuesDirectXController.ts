/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { GetRoutingKeyQueuesDirectXControllerRequestPathDTO } from '../../dto/controllers/exchange-direct/GetRoutingKeyQueuesDirectXControllerRequestPathDTO.js';
import { GetRoutingKeyQueuesDirectXControllerResponseDTO } from '../../dto/controllers/exchange-direct/GetRoutingKeyQueuesDirectXControllerResponseDTO.js';
import {
  TControllerRequestHandler,
  TControllerRequestPayloadEmpty,
} from '../../lib/controller/types/index.js';
import { Container } from '../../container/Container.js';

export const getRoutingKeyQueuesDirectXController: TControllerRequestHandler<
  GetRoutingKeyQueuesDirectXControllerRequestPathDTO,
  TControllerRequestPayloadEmpty,
  TControllerRequestPayloadEmpty,
  GetRoutingKeyQueuesDirectXControllerResponseDTO
> = async (ctx) => {
  const service = Container.getInstance().resolve('exchangeDirectService');
  const { ns, direct: name, routingKey } = ctx.scope.resolve('requestPathDTO');
  const queues = await service.getRoutingKeyQueues({ ns, name }, routingKey);
  return [200, queues];
};
