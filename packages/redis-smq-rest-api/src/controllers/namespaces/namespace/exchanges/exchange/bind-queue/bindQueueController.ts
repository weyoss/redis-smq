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
import { BindQueueControllerRequestPathDTO } from './BindQueueControllerRequestPathDTO.js';
import { BindQueueControllerRequestQueryDTO } from './BindQueueControllerRequestQueryDTO.js';
import { BindQueueControllerResponseDTO } from './BindQueueControllerResponseDTO.js';

export const bindQueueController: TControllerRequestHandler<
  BindQueueControllerRequestPathDTO,
  BindQueueControllerRequestQueryDTO,
  TControllerRequestPayloadEmpty,
  BindQueueControllerResponseDTO
> = async (ctx) => {
  const service = Container.getInstance().resolve('exchangesService');
  const { ns, exchange, queue } = ctx.scope.resolve('requestPathDTO');
  const queryParams = ctx.scope.resolve('requestQueryDTO');

  await service.bindQueue(
    { ns, name: queue },
    { ns, name: exchange },
    queryParams,
  );
  return [204, null];
};
