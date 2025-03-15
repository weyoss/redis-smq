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
import { GetMessagesByIdsControllerRequestQueryDTO } from '../../dto/controllers/messages/GetMessagesByIdsControllerRequestQueryDTO.js';
import { GetMessagesByIdsControllerResponseDTO } from '../../dto/controllers/messages/GetMessagesByIdsControllerResponseDTO.js';

export const getMessagesByIdsController: TControllerRequestHandler<
  TControllerRequestPayloadEmpty,
  GetMessagesByIdsControllerRequestQueryDTO,
  TControllerRequestPayloadEmpty,
  GetMessagesByIdsControllerResponseDTO
> = async (ctx) => {
  const messagesService = Container.getInstance().resolve('messagesService');
  const { ids } = ctx.scope.resolve('requestQueryDTO');
  const r = await messagesService.getMessagesByIds(ids);
  return [200, r];
};
