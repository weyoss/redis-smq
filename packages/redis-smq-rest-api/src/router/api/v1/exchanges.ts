/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { getExchangesController } from '../../../controllers/exchanges/getExchangesController.js';
import { EControllerRequestMethod } from '../../../lib/controller/types/index.js';
import { TRouterResourceMap } from '../../../lib/router/types/index.js';

export const exchanges: TRouterResourceMap = {
  path: 'exchanges',
  tags: ['Exchanges'],
  resource: [
    {
      handler: getExchangesController,
      method: EControllerRequestMethod.GET,
      payload: [],
    },
  ],
};
