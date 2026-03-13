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
} from '../../lib/controller/types/index.js';
import { Container } from '../../container/Container.js';
import { GetQueueStateControllerRequestPathDTO } from '../../dto/controllers/queue-state/GetQueueStateControllerRequestPathDTO.js';
import { GetQueueStateControllerResponseDTO } from '../../dto/controllers/queue-state/GetQueueStateControllerResponseDTO.js';

export const getQueueStateController: TControllerRequestHandler<
  GetQueueStateControllerRequestPathDTO,
  TControllerRequestPayloadEmpty,
  TControllerRequestPayloadEmpty,
  GetQueueStateControllerResponseDTO
> = async (ctx) => {
  const service = Container.getInstance().resolve(
    'queueOperationalStateService',
  );
  const queueParams = ctx.scope.resolve('requestPathDTO');
  const r = await service.getState(queueParams);
  return [200, r];
};
