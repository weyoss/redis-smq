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
import { BindQueueControllerRequestBodyDTO } from '../../dto/controllers/exchange-fan-out/BindQueueControllerRequestBodyDTO.js';
import { BindQueueControllerRequestPathDTO } from '../../dto/controllers/exchange-fan-out/BindQueueControllerRequestPathDTO.js';
import { BindQueueControllerResponseDTO } from '../../dto/controllers/exchange-fan-out/BindQueueControllerResponseDTO.js';

export const bindQueueController: TControllerRequestHandler<
  BindQueueControllerRequestPathDTO,
  TControllerRequestPayloadEmpty,
  BindQueueControllerRequestBodyDTO,
  BindQueueControllerResponseDTO
> = async (ctx) => {
  const service = Container.getInstance().resolve('exchangeFanOutService');
  const { fanOutName } = ctx.scope.resolve('requestPathDTO');
  const { queue } = ctx.scope.resolve('requestBodyDTO');
  await service.bindQueue(queue, fanOutName);
  return [204, null];
};
