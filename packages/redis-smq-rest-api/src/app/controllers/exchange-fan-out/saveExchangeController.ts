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
import { SaveExchangeControllerRequestBodyDTO } from '../../dto/controllers/exchange-fan-out/SaveExchangeControllerRequestBodyDTO.js';
import { SaveExchangeControllerResponseDTO } from '../../dto/controllers/exchange-fan-out/SaveExchangeControllerResponseDTO.js';

export const saveExchangeController: TControllerRequestHandler<
  TControllerRequestPayloadEmpty,
  TControllerRequestPayloadEmpty,
  SaveExchangeControllerRequestBodyDTO,
  SaveExchangeControllerResponseDTO
> = async (ctx) => {
  const service = Container.getInstance().resolve('exchangeFanOutService');
  const { fanOutName } = ctx.scope.resolve('requestBodyDTO');
  await service.saveExchange(fanOutName);
  return [204, null];
};
