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
import { GetMessageStatusControllerRequestPathDTO } from '../../dto/controllers/messages/GetMessageStatusControllerRequestPathDTO.js';
import { GetMessageStatusControllerResponseDTO } from '../../dto/controllers/messages/GetMessageStatusControllerResponseDTO.js';

export const getMessageStatusController: TControllerRequestHandler<
  GetMessageStatusControllerRequestPathDTO,
  TControllerRequestPayloadEmpty,
  TControllerRequestPayloadEmpty,
  GetMessageStatusControllerResponseDTO
> = async (ctx) => {
  const messagesService = Container.getInstance().resolve('messagesService');
  const { id } = ctx.scope.resolve('requestPathDTO');
  const r = await messagesService.getMessageStatus(id);
  return [200, r];
};
