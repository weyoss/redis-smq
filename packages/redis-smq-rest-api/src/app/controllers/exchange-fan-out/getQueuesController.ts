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
import { GetQueuesControllerRequestPathDTO } from '../../dto/controllers/exchange-fan-out/GetQueuesControllerRequestPathDTO.js';
import { GetQueuesControllerResponseDTO } from '../../dto/controllers/exchange-fan-out/GetQueuesControllerResponseDTO.js';

export const getQueuesController: TControllerRequestHandler<
  GetQueuesControllerRequestPathDTO,
  TControllerRequestPayloadEmpty,
  TControllerRequestPayloadEmpty,
  GetQueuesControllerResponseDTO
> = async (ctx) => {
  const service = Container.getInstance().resolve('exchangeFanOutService');
  const { fanOutName } = ctx.scope.resolve('requestPathDTO');
  const queues = await service.getQueues(fanOutName);
  return [200, queues];
};
