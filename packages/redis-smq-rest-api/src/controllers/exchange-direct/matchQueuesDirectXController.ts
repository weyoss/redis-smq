/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { MatchQueuesDirectXControllerRequestPathDTO } from '../../dto/controllers/exchange-direct/MatchQueuesDirectXControllerRequestPathDTO.js';
import { MatchQueuesDirectXControllerRequestQueryDTO } from '../../dto/controllers/exchange-direct/MatchQueuesDirectXControllerRequestQueryDTO.js';
import { MatchQueuesDirectXControllerResponseDTO } from '../../dto/controllers/exchange-direct/MatchQueuesDirectXControllerResponseDTO.js';
import {
  TControllerRequestHandler,
  TControllerRequestPayloadEmpty,
} from '../../lib/controller/types/index.js';
import { Container } from '../../container/Container.js';

export const matchQueuesDirectXController: TControllerRequestHandler<
  MatchQueuesDirectXControllerRequestPathDTO,
  MatchQueuesDirectXControllerRequestQueryDTO,
  TControllerRequestPayloadEmpty,
  MatchQueuesDirectXControllerResponseDTO
> = async (ctx) => {
  const service = Container.getInstance().resolve('exchangeDirectService');
  const { ns, direct: name } = ctx.scope.resolve('requestPathDTO');
  const { routingKey } = ctx.scope.resolve('requestQueryDTO');
  const queues = await service.matchQueues({ ns, name }, routingKey);
  return [200, queues];
};
