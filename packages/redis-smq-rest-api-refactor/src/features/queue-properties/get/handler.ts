/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { Controller, PathInput } from '../../../http/index.js';
import type { GetQueuePropertiesControllerRequestPathDTO } from './GetQueuePropertiesControllerRequestPathDTO.js';
import type { GetQueuePropertiesControllerResponseDTO } from './GetQueuePropertiesControllerResponseDTO.js';

export const getQueueProperties: Controller<
  PathInput<GetQueuePropertiesControllerRequestPathDTO>,
  GetQueuePropertiesControllerResponseDTO
> = async (deps, input) => {
  const { ns, name } = input.path;
  const properties = await deps.queueManager.getProperties({ ns, name });
  return [200, properties];
};
