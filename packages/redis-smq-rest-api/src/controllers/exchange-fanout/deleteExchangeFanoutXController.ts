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
import { DeleteExchangeFanoutXControllerRequestPathDTO } from '../../dto/controllers/exchange-fanout/DeleteExchangeFanoutXControllerRequestPathDTO.js';
import { DeleteExchangeFanoutXControllerResponseDTO } from '../../dto/controllers/exchange-fanout/DeleteExchangeFanoutXControllerResponseDTO.js';

export const deleteExchangeFanoutXController: TControllerRequestHandler<
  DeleteExchangeFanoutXControllerRequestPathDTO,
  TControllerRequestPayloadEmpty,
  TControllerRequestPayloadEmpty,
  DeleteExchangeFanoutXControllerResponseDTO
> = async (ctx) => {
  const service = Container.getInstance().resolve('exchangeFanoutService');
  const { ns, fanout: name } = ctx.scope.resolve('requestPathDTO');
  await service.deleteExchange({ ns, name });
  return [204, null];
};
