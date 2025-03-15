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
import { GetMessageByIdControllerRequestPathDTO } from '../../dto/controllers/messages/GetMessageByIdControllerRequestPathDTO.js';
import { GetMessageByIdControllerResponseDTO } from '../../dto/controllers/messages/GetMessageByIdControllerResponseDTO.js';

export const getMessageByIdController: TControllerRequestHandler<
  GetMessageByIdControllerRequestPathDTO,
  TControllerRequestPayloadEmpty,
  TControllerRequestPayloadEmpty,
  GetMessageByIdControllerResponseDTO
> = async (ctx) => {
  const messagesService = Container.getInstance().resolve('messagesService');
  const { id } = ctx.scope.resolve('requestPathDTO');
  const r = await messagesService.getMessageById(id);
  return [200, r];
};
