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
import { GetConfigurationControllerResponseDTO } from '../../dto/controllers/configuration/GetConfigurationControllerResponseDTO.js';

export const getConfigurationController: TControllerRequestHandler<
  TControllerRequestPayloadEmpty,
  TControllerRequestPayloadEmpty,
  TControllerRequestPayloadEmpty,
  GetConfigurationControllerResponseDTO
> = async () => {
  const service = Container.getInstance().resolve('configurationService');
  const r = await service.getConfiguration();
  return [200, r];
};
