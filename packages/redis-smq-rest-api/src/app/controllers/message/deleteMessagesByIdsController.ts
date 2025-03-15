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
import { DeleteMessagesByIdsControllerRequestQueryDTO } from '../../dto/controllers/messages/DeleteMessagesByIdsControllerRequestQueryDTO.js';
import { DeleteMessagesByIdsControllerResponseDTO } from '../../dto/controllers/messages/DeleteMessagesByIdsControllerResponseDTO.js';

export const deleteMessagesByIdsController: TControllerRequestHandler<
  TControllerRequestPayloadEmpty,
  DeleteMessagesByIdsControllerRequestQueryDTO,
  TControllerRequestPayloadEmpty,
  DeleteMessagesByIdsControllerResponseDTO
> = async (ctx) => {
  const messagesService = Container.getInstance().resolve('messagesService');
  const { ids } = ctx.scope.resolve('requestQueryDTO');
  await messagesService.deleteMessagesByIds(ids);
  return [204, null];
};
