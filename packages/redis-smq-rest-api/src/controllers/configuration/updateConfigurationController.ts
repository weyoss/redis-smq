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
import { UpdateConfigurationControllerRequestBodyDTO } from './UpdateConfigurationControllerRequestBodyDTO.js';
import { UpdateConfigurationControllerResponseDTO } from './UpdateConfigurationControllerResponseDTO.js';

export const updateConfigurationController: TControllerRequestHandler<
  TControllerRequestPayloadEmpty,
  TControllerRequestPayloadEmpty,
  UpdateConfigurationControllerRequestBodyDTO,
  UpdateConfigurationControllerResponseDTO
> = async (ctx) => {
  const service = Container.getInstance().resolve('configurationService');
  const cfg = ctx.scope.resolve('requestBodyDTO');
  const r = await service.updateConfig(cfg);
  return [200, r];
};
