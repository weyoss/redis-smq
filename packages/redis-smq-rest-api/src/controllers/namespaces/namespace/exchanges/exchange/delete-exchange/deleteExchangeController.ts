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
import { DeleteExchangeControllerRequestPathDTO } from './DeleteExchangeControllerRequestPathDTO.js';
import { DeleteExchangeControllerResponseDTO } from './DeleteExchangeControllerResponseDTO.js';

export const deleteExchangeController: TControllerRequestHandler<
  DeleteExchangeControllerRequestPathDTO,
  TControllerRequestPayloadEmpty,
  TControllerRequestPayloadEmpty,
  DeleteExchangeControllerResponseDTO
> = async (ctx) => {
  const service = Container.getInstance().resolve('exchangesService');
  const { ns, exchange } = ctx.scope.resolve('requestPathDTO');
  await service.deleteExchange({ ns, name: exchange });
  return [204, null];
};
