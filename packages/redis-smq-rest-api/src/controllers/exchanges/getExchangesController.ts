/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { GetExchangesControllerResponseDTO } from '../../dto/controllers/exchanges/GetExchangesControllerResponseDTO.js';
import {
  TControllerRequestHandler,
  TControllerRequestPayloadEmpty,
} from '../../lib/controller/types/index.js';
import { Container } from '../../container/Container.js';

export const getExchangesController: TControllerRequestHandler<
  TControllerRequestPayloadEmpty,
  TControllerRequestPayloadEmpty,
  TControllerRequestPayloadEmpty,
  GetExchangesControllerResponseDTO
> = async () => {
  const queueService = Container.getInstance().resolve('exchangesService');
  const r = await queueService.getAllExchanges();
  return [200, r];
};
