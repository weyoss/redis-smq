/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  ERequestMethod,
  ERequestPayload,
} from '../../lib/controller/types/index.js';
import { TRouterResourceMap } from '../../lib/router/types/index.js';
import { getConfigurationController } from '../../controllers/configuration/getConfigurationController.js';
import { updateConfigurationController } from '../../controllers/configuration/updateConfigurationController.js';

export const configuration: TRouterResourceMap = {
  path: 'config',
  tags: ['Configuration'],
  resource: [
    {
      handler: getConfigurationController,
      method: ERequestMethod.GET,
      payload: [],
    },
    {
      handler: updateConfigurationController,
      method: ERequestMethod.PATCH,
      payload: [ERequestPayload.BODY],
    },
  ],
};
