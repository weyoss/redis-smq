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
} from '../../lib/controller/types/index.js';
import { Container } from '../../container/Container.js';
import { DeleteExchangeControllerRequestPathDTO } from '../../dto/controllers/exchange-fan-out/DeleteExchangeControllerRequestPathDTO.js';
import { DeleteExchangeControllerResponseDTO } from '../../dto/controllers/exchange-fan-out/DeleteExchangeControllerResponseDTO.js';

export const deleteExchangeController: TControllerRequestHandler<
  DeleteExchangeControllerRequestPathDTO,
  TControllerRequestPayloadEmpty,
  TControllerRequestPayloadEmpty,
  DeleteExchangeControllerResponseDTO
> = async (ctx) => {
  const service = Container.getInstance().resolve('exchangeFanOutService');
  const { fanOutName } = ctx.scope.resolve('requestPathDTO');
  await service.deleteExchange(fanOutName);
  return [204, null];
};
