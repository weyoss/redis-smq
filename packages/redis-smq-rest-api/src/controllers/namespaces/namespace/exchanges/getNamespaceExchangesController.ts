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
} from '../../../../lib/types/controller.js';
import { Container } from '../../../../container/Container.js';
import { GetNamespaceExchangesControllerRequestPathDTO } from './GetNamespaceExchangesControllerRequestPathDTO.js';
import { GetNamespaceExchangesControllerResponseDTO } from './GetNamespaceExchangesControllerResponseDTO.js';

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
