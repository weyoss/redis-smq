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
import { GetRoutingPatternsControllerResponseDTO } from './GetRoutingPatternsControllerResponseDTO.js';
import { GetRoutingPatternsControllerRequestPathDTO } from './GetRoutingPatternsControllerRequestPathDTO.js';

export const getRoutingPatternsController: TControllerRequestHandler<
  GetRoutingPatternsControllerRequestPathDTO,
  TControllerRequestPayloadEmpty,
  TControllerRequestPayloadEmpty,
  GetRoutingPatternsControllerResponseDTO
> = async (ctx) => {
  const service = Container.getInstance().resolve('exchangesService');
  const { ns, exchange } = ctx.scope.resolve('requestPathDTO');

  const r = await service.getRoutingPatterns({ ns, name: exchange });
  return [200, r];
};
