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
import { MatchQueuesControllerRequestPathDTO } from './MatchQueuesControllerRequestPathDTO.js';
import { MatchQueuesControllerResponseDTO } from './MatchQueuesControllerResponseDTO.js';
import { MatchQueuesControllerRequestQueryDTO } from './MatchQueuesControllerRequestQueryDTO.js';

export const matchQueuesController: TControllerRequestHandler<
  MatchQueuesControllerRequestPathDTO,
  MatchQueuesControllerRequestQueryDTO,
  TControllerRequestPayloadEmpty,
  MatchQueuesControllerResponseDTO
> = async (ctx) => {
  const service = Container.getInstance().resolve('exchangesService');
  const { ns, exchange: name } = ctx.scope.resolve('requestPathDTO');
  const queryParams = ctx.scope.resolve('requestQueryDTO');

  const queues = await service.matchQueues({ ns, name }, queryParams);
  return [200, queues];
};
