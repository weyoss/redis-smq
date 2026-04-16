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
import { GetQueueMessagesControllerRequestPathDTO } from './GetQueueMessagesControllerRequestPathDTO.js';
import { GetQueueMessagesControllerRequestQueryDTO } from './GetQueueMessagesControllerRequestQueryDTO.js';
import { GetQueueMessagesControllerResponseDTO } from './GetQueueMessagesControllerResponseDTO.js';

export const getQueueMessagesController: TControllerRequestHandler<
  GetQueueMessagesControllerRequestPathDTO,
  GetQueueMessagesControllerRequestQueryDTO,
  TControllerRequestPayloadEmpty,
  GetQueueMessagesControllerResponseDTO
> = async (ctx) => {
  const service = Container.getInstance().resolve('queueMessagesService');
  const queueParams = ctx.scope.resolve('requestPathDTO');
  const queryParams = ctx.scope.resolve('requestQueryDTO');
  const r = await service.getMessages(queueParams, queryParams);
  return [200, r];
};
