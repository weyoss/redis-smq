/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { BodyInput, Controller } from '../../../http/index.js';
import type { UpdateConfigurationControllerRequestBodyDTO } from './UpdateConfigurationControllerRequestBodyDTO.js';
import { UpdateConfigurationControllerResponseDTO } from './UpdateConfigurationControllerResponseDTO.js';

export const updateConfiguration: Controller<
  BodyInput<UpdateConfigurationControllerRequestBodyDTO>,
  UpdateConfigurationControllerResponseDTO
> = async (deps, input) => {
  deps.logger.debug('Updating library configuration');
  await deps.configManager.updateConfig(input.body);
  const updated = await deps.configManager.getConfig();
  return [200, updated];
};
