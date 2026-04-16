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
} from '../../../../../../lib/types/controller.js';
import { Container } from '../../../../../../container/Container.js';
import { GetRoutingKeysControllerResponseDTO } from './GetRoutingKeysControllerResponseDTO.js';
import { GetRoutingKeysControllerRequestPathDTO } from './GetRoutingKeysControllerRequestPathDTO.js';

export const getRoutingKeysController: TControllerRequestHandler<
  GetRoutingKeysControllerRequestPathDTO,
  TControllerRequestPayloadEmpty,
  TControllerRequestPayloadEmpty,
  GetRoutingKeysControllerResponseDTO
> = async (ctx) => {
  const service = Container.getInstance().resolve('exchangesService');
  const { ns, exchange } = ctx.scope.resolve('requestPathDTO');

  const r = await service.getRoutingKeys({ ns, name: exchange });
  return [200, r];
};
