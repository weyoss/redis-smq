/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { BindQueueDirectXControllerRequestPathDTO } from '../../dto/controllers/exchange-direct/BindQueueDirectXControllerRequestPathDTO.js';
import { BindQueueDirectXControllerRequestQueryDTO } from '../../dto/controllers/exchange-direct/BindQueueDirectXControllerRequestQueryDTO.js';
import { BindQueueDirectXControllerResponseDTO } from '../../dto/controllers/exchange-direct/BindQueueDirectXControllerResponseDTO.js';
import {
  TControllerRequestHandler,
  TControllerRequestPayloadEmpty,
} from '../../lib/controller/types/index.js';
import { Container } from '../../container/Container.js';

export const bindQueueDirectXController: TControllerRequestHandler<
  BindQueueDirectXControllerRequestPathDTO,
  BindQueueDirectXControllerRequestQueryDTO,
  TControllerRequestPayloadEmpty,
  BindQueueDirectXControllerResponseDTO
> = async (ctx) => {
  const service = Container.getInstance().resolve('exchangeDirectService');
  const { ns, direct, queue } = ctx.scope.resolve('requestPathDTO');
  const { routingKey } = ctx.scope.resolve('requestQueryDTO');
  await service.bindQueue(
    { ns, name: queue },
    { ns, name: direct },
    routingKey,
  );
  return [204, null];
};
