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
import { GetBindingsControllerRequestPathDTO } from './GetBindingsControllerRequestPathDTO.js';
import { GetBindingsControllerRequestQueryDTO } from './GetBindingsControllerRequestQueryDTO.js';
import { GetBindingsControllerResponseDTO } from './GetBindingsControllerResponseDTO.js';

export const getBindingsController: TControllerRequestHandler<
  GetBindingsControllerRequestPathDTO,
  GetBindingsControllerRequestQueryDTO,
  TControllerRequestPayloadEmpty,
  GetBindingsControllerResponseDTO
> = async (ctx) => {
  const service = Container.getInstance().resolve('exchangesService');
  const { ns, exchange } = ctx.scope.resolve('requestPathDTO');
  const queryParams = ctx.scope.resolve('requestQueryDTO');

  const b = await service.getBindings({ ns, name: exchange }, queryParams);
  return [200, b];
};
