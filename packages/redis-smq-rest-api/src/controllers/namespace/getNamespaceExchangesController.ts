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
} from '../../lib/controller/types/index.js';
import { Container } from '../../container/Container.js';
import { GetNamespaceExchangesControllerRequestPathDTO } from '../../dto/controllers/namespaces/GetNamespaceExchangesControllerRequestPathDTO.js';
import { GetNamespaceExchangesControllerResponseDTO } from '../../dto/controllers/namespaces/GetNamespaceExchangesControllerResponseDTO.js';

export const getNamespaceExchangesController: TControllerRequestHandler<
  GetNamespaceExchangesControllerRequestPathDTO,
  TControllerRequestPayloadEmpty,
  TControllerRequestPayloadEmpty,
  GetNamespaceExchangesControllerResponseDTO
> = async (ctx) => {
  const exchangesService = Container.getInstance().resolve('exchangesService');
  const { ns } = ctx.scope.resolve('requestPathDTO');
  const r = await exchangesService.getNamespaceExchanges(ns);
  return [200, r];
};
