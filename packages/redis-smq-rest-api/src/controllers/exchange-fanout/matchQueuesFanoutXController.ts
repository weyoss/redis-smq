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
} from '../../lib/controller/types/index.js';
import { Container } from '../../container/Container.js';
import { MatchQueuesFanoutXControllerRequestPathDTO } from '../../dto/controllers/exchange-fanout/MatchQueuesFanoutXControllerRequestPathDTO.js';
import { MatchQueuesFanoutXControllerResponseDTO } from '../../dto/controllers/exchange-fanout/MatchQueuesFanoutXControllerResponseDTO.js';

export const matchQueuesFanoutXController: TControllerRequestHandler<
  MatchQueuesFanoutXControllerRequestPathDTO,
  TControllerRequestPayloadEmpty,
  TControllerRequestPayloadEmpty,
  MatchQueuesFanoutXControllerResponseDTO
> = async (ctx) => {
  const service = Container.getInstance().resolve('exchangeFanoutService');
  const { ns, fanout: name } = ctx.scope.resolve('requestPathDTO');
  const queues = await service.matchQueues({ ns, name });
  return [200, queues];
};
