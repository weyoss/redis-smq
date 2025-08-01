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
import { UnbindQueueControllerRequestPathDTO } from '../../dto/controllers/exchange-fan-out/UnbindQueueControllerRequestPathDTO.js';
import { UnbindQueueControllerRequestQueryDTO } from '../../dto/controllers/exchange-fan-out/UnbindQueueControllerRequestQueryDTO.js';
import { UnbindQueueControllerResponseDTO } from '../../dto/controllers/exchange-fan-out/UnbindQueueControllerResponseDTO.js';

export const unbindQueueController: TControllerRequestHandler<
  UnbindQueueControllerRequestPathDTO,
  UnbindQueueControllerRequestQueryDTO,
  TControllerRequestPayloadEmpty,
  UnbindQueueControllerResponseDTO
> = async (ctx) => {
  const service = Container.getInstance().resolve('exchangeFanOutService');
  const { fanOutName } = ctx.scope.resolve('requestPathDTO');
  const queue = ctx.scope.resolve('requestQueryDTO');
  await service.unbindQueue(queue, fanOutName);
  return [204, null];
};
