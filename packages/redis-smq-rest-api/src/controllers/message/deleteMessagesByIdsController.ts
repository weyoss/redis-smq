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
} from '../../lib/types/controller.js';
import { Container } from '../../container/Container.js';
import { DeleteMessagesByIdsControllerRequestQueryDTO } from './DeleteMessagesByIdsControllerRequestQueryDTO.js';
import { DeleteMessagesByIdsControllerResponseDTO } from './DeleteMessagesByIdsControllerResponseDTO.js';

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
