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
} from '../../lib/controller/types/index.js';
import { Container } from '../../container/Container.js';
import { BindQueueFanoutXControllerRequestPathDTO } from '../../dto/controllers/exchange-fanout/BindQueueFanoutXControllerRequestPathDTO.js';
import { BindQueueFanoutXControllerResponseDTO } from '../../dto/controllers/exchange-fanout/BindQueueFanoutXControllerResponseDTO.js';

export const bindQueueFanoutXController: TControllerRequestHandler<
  BindQueueFanoutXControllerRequestPathDTO,
  TControllerRequestPayloadEmpty,
  TControllerRequestPayloadEmpty,
  BindQueueFanoutXControllerResponseDTO
> = async (ctx) => {
  const service = Container.getInstance().resolve('exchangeFanoutService');
  const { ns, fanout, queue } = ctx.scope.resolve('requestPathDTO');
  await service.bindQueue({ ns, name: queue }, { ns, name: fanout });
  return [204, null];
};
