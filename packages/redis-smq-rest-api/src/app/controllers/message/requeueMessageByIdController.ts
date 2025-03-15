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
import { RequeueMessageByIdControllerRequestPathDTO } from '../../dto/controllers/messages/RequeueMessageByIdControllerRequestPathDTO.js';
import { RequeueMessageByIdControllerResponseDTO } from '../../dto/controllers/messages/RequeueMessageByIdControllerResponseDTO.js';

export const requeueMessageByIdController: TControllerRequestHandler<
  RequeueMessageByIdControllerRequestPathDTO,
  TControllerRequestPayloadEmpty,
  TControllerRequestPayloadEmpty,
  RequeueMessageByIdControllerResponseDTO
> = async (ctx) => {
  const messagesService = Container.getInstance().resolve('messagesService');
  const { id } = ctx.scope.resolve('requestPathDTO');
  await messagesService.requeueMessageById(id);
  return [204, null];
};
