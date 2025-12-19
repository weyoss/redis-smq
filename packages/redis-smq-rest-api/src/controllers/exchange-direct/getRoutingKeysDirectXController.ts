/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { GetRoutingKeysDirectXControllerRequestPathDTO } from '../../dto/controllers/exchange-direct/GetRoutingKeysDirectXControllerRequestPathDTO.js';
import { GetRoutingKeysDirectXControllerResponseDTO } from '../../dto/controllers/exchange-direct/GetRoutingKeysDirectXControllerResponseDTO.js';
import {
  TControllerRequestHandler,
  TControllerRequestPayloadEmpty,
} from '../../lib/controller/types/index.js';
import { Container } from '../../container/Container.js';

export const getRoutingKeysDirectXController: TControllerRequestHandler<
  GetRoutingKeysDirectXControllerRequestPathDTO,
  TControllerRequestPayloadEmpty,
  TControllerRequestPayloadEmpty,
  GetRoutingKeysDirectXControllerResponseDTO
> = async (ctx) => {
  const service = Container.getInstance().resolve('exchangeDirectService');
  const { ns, direct: name } = ctx.scope.resolve('requestPathDTO');
  const queues = await service.getRoutingKeys({ ns, name });
  return [200, queues];
};
