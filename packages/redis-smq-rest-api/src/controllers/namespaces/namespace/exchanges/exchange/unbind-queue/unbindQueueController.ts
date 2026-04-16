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
} from '../../../../../../lib/types/controller.js';
import { Container } from '../../../../../../container/Container.js';
import { UnbindQueueControllerResponseDTO } from './UnbindQueueControllerResponseDTO.js';
import { UnbindQueueControllerRequestQueryDTO } from './UnbindQueueControllerRequestQueryDTO.js';
import { UnbindQueueControllerRequestPathDTO } from './UnbindQueueControllerRequestPathDTO.js';

export const unbindQueueController: TControllerRequestHandler<
  UnbindQueueControllerRequestPathDTO,
  UnbindQueueControllerRequestQueryDTO,
  TControllerRequestPayloadEmpty,
  UnbindQueueControllerResponseDTO
> = async (ctx) => {
  const service = Container.getInstance().resolve('exchangesService');
  const { ns, exchange, queue } = ctx.scope.resolve('requestPathDTO');
  const queryParams = ctx.scope.resolve('requestQueryDTO');
  await service.unbindQueue(
    { ns, name: queue },
    { ns, name: exchange },
    queryParams,
  );
  return [204, null];
};
