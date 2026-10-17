/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { RouteDefinition } from '../../../http/index.js';
import { getResponseSchemas, getSchema } from '../../../http/index.js';
import { getQueueConsumers } from './handler.js';

export const getQueueConsumersRoute: RouteDefinition = {
  method: 'get',
  path: '/api/namespaces/:ns/queues/:name/consumers',
  tags: ['Queue Consumers'],
  operationId: 'getQueueConsumers',
  request: {
    path: getSchema('GetQueueConsumersControllerRequestPathDTO'),
  },
  response: getResponseSchemas('GetQueueConsumersControllerResponseDTO'),
  handler: getQueueConsumers,
};
