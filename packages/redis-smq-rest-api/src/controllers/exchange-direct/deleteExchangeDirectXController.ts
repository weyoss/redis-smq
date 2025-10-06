/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { DeleteExchangeDirectXControllerRequestPathDTO } from '../../dto/controllers/exchange-direct/DeleteExchangeDirectXControllerRequestPathDTO.js';
import { DeleteExchangeDirectXControllerResponseDTO } from '../../dto/controllers/exchange-direct/DeleteExchangeDirectXControllerResponseDTO.js';
import {
  TControllerRequestHandler,
  TControllerRequestPayloadEmpty,
} from '../../lib/controller/types/index.js';
import { Container } from '../../container/Container.js';

export const deleteExchangeDirectXController: TControllerRequestHandler<
  DeleteExchangeDirectXControllerRequestPathDTO,
  TControllerRequestPayloadEmpty,
  TControllerRequestPayloadEmpty,
  DeleteExchangeDirectXControllerResponseDTO
> = async (ctx) => {
  const service = Container.getInstance().resolve('exchangeDirectService');
  const { ns, direct: name } = ctx.scope.resolve('requestPathDTO');
  await service.deleteExchange({ ns, name });
  return [204, null];
};
