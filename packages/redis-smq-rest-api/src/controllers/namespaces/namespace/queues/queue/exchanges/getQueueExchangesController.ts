/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { GetQueueExchangesControllerResponseDTO } from './GetQueueExchangesControllerResponseDTO.js';
import { GetQueueExchangesControllerRequestPathDTO } from './GetQueueExchangesControllerRequestPathDTO.js';
import {
  TControllerRequestHandler,
  TControllerRequestPayloadEmpty,
} from '../../../../../../lib/types/controller.js';
import { Container } from '../../../../../../container/Container.js';

export const getQueueExchangesController: TControllerRequestHandler<
  GetQueueExchangesControllerRequestPathDTO,
  TControllerRequestPayloadEmpty,
  TControllerRequestPayloadEmpty,
  GetQueueExchangesControllerResponseDTO
> = async (ctx) => {
  const service = Container.getInstance().resolve('exchangesService');
  const { ns, name } = ctx.scope.resolve('requestPathDTO');
  const queues = await service.getQueueExchanges({ ns, name });
  return [200, queues];
};
