/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { UnbindQueueDirectXControllerRequestPathDTO } from '../../dto/controllers/exchange-direct/UnbindQueueDirectXControllerRequestPathDTO.js';
import { UnbindQueueDirectXControllerRequestQueryDTO } from '../../dto/controllers/exchange-direct/UnbindQueueDirectXControllerRequestQueryDTO.js';
import { UnbindQueueDirectXControllerResponseDTO } from '../../dto/controllers/exchange-direct/UnbindQueueDirectXControllerResponseDTO.js';
import {
  TControllerRequestHandler,
  TControllerRequestPayloadEmpty,
} from '../../lib/controller/types/index.js';
import { Container } from '../../container/Container.js';

export const unbindQueueDirectXController: TControllerRequestHandler<
  UnbindQueueDirectXControllerRequestPathDTO,
  UnbindQueueDirectXControllerRequestQueryDTO,
  TControllerRequestPayloadEmpty,
  UnbindQueueDirectXControllerResponseDTO
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
