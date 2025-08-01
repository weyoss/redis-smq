/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  EControllerRequestMethod,
  EControllerRequestPayload,
} from '../../../lib/controller/types/index.js';
import { TRouterResourceMap } from '../../../lib/router/types/index.js';
import { bindQueueController } from '../../../controllers/exchange-fan-out/bindQueueController.js';
import { getAllExchangesController } from '../../../controllers/exchange-fan-out/getAllExchangesController.js';
import { getQueuesController } from '../../../controllers/exchange-fan-out/getQueuesController.js';
import { saveExchangeController } from '../../../controllers/exchange-fan-out/saveExchangeController.js';
import { deleteExchangeController } from '../../../controllers/exchange-fan-out/deleteExchangeController.js';
import { unbindQueueController } from '../../../controllers/exchange-fan-out/unbindQueueController.js';

export const exchanges: TRouterResourceMap = {
  path: 'exchanges',
  tags: ['Exchanges'],
  resource: [
    {
      path: 'fan-out',
      resource: [
        {
          handler: getAllExchangesController,
          method: EControllerRequestMethod.GET,
          payload: [EControllerRequestPayload.QUERY],
        },
        {
          handler: saveExchangeController,
          method: EControllerRequestMethod.POST,
          payload: [EControllerRequestPayload.BODY],
        },
        {
          path: ':fanOutName',
          resource: [
            {
              handler: deleteExchangeController,
              method: EControllerRequestMethod.DELETE,
              payload: [EControllerRequestPayload.PATH],
            },
            {
              path: 'queues',
              resource: [
                {
                  handler: getQueuesController,
                  method: EControllerRequestMethod.GET,
                  payload: [EControllerRequestPayload.PATH],
                },
                {
                  handler: bindQueueController,
                  method: EControllerRequestMethod.PUT,
                  payload: [
                    EControllerRequestPayload.PATH,
                    EControllerRequestPayload.BODY,
                  ],
                },
                {
                  handler: unbindQueueController,
                  method: EControllerRequestMethod.DELETE,
                  payload: [
                    EControllerRequestPayload.PATH,
                    EControllerRequestPayload.QUERY,
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
