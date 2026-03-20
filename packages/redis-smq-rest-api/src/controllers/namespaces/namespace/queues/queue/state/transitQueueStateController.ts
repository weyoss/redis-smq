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
import { TransitQueueStateControllerRequestPathDTO } from './TransitQueueStateControllerRequestPathDTO.js';
import { TransitQueueStateControllerRequestBodyDTO } from './TransitQueueStateControllerRequestBodyDTO.js';
import { TransitQueueStateControllerResponseDTO } from './TransitQueueStateControllerResponseDTO.js';

export const transitQueueStateController: TControllerRequestHandler<
  TransitQueueStateControllerRequestPathDTO,
  TControllerRequestPayloadEmpty,
  TransitQueueStateControllerRequestBodyDTO,
  TransitQueueStateControllerResponseDTO
> = async (ctx) => {
  const service = Container.getInstance().resolve(
    'queueOperationalStateService',
  );
  const queueParams = ctx.scope.resolve('requestPathDTO');
  const queueStateAction = ctx.scope.resolve('requestBodyDTO');

  const r = await service.transitQueueState(queueParams, queueStateAction);
  return [200, r];
};
