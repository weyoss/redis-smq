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
import { DeleteMessageByIdControllerRequestPathDTO } from './DeleteMessageByIdControllerRequestPathDTO.js';
import { DeleteMessageByIdControllerResponseDTO } from './DeleteMessageByIdControllerResponseDTO.js';

export const deleteMessageByIdController: TControllerRequestHandler<
  DeleteMessageByIdControllerRequestPathDTO,
  TControllerRequestPayloadEmpty,
  TControllerRequestPayloadEmpty,
  DeleteMessageByIdControllerResponseDTO
> = async (ctx) => {
  const messagesService = Container.getInstance().resolve('messagesService');
  const { id } = ctx.scope.resolve('requestPathDTO');
  await messagesService.deleteMessageById(id);
  return [204, null];
};
