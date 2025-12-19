/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
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
import { createQueueController } from '../../../controllers/queue/createQueueController.js';
import { getAllQueuesController } from '../../../controllers/queue/getAllQueuesController.js';

export const queues: TRouterResourceMap = {
  path: 'queues',
  tags: ['Queues'],
  resource: [
    {
      handler: getAllQueuesController,
      method: EControllerRequestMethod.GET,
      payload: [],
    },
    {
      handler: createQueueController,
      method: EControllerRequestMethod.POST,
      payload: [EControllerRequestPayload.BODY],
    },
  ],
};
