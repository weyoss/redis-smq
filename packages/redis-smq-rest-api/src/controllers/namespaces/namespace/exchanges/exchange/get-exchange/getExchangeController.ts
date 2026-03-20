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
import { GetExchangeControllerRequestPathDTO } from './GetExchangeControllerRequestPathDTO.js';
import { GetExchangeControllerResponseDTO } from './GetExchangeControllerResponseDTO.js';

export const getExchangeController: TControllerRequestHandler<
  GetExchangeControllerRequestPathDTO,
  TControllerRequestPayloadEmpty,
  TControllerRequestPayloadEmpty,
  GetExchangeControllerResponseDTO
> = async (ctx) => {
  const service = Container.getInstance().resolve('exchangesService');
  const { ns, exchange } = ctx.scope.resolve('requestPathDTO');
  const r = await service.getExchange({ ns, name: exchange });
  return [200, r];
};
