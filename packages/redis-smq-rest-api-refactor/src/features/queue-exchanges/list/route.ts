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
import { getQueueExchanges } from './handler.js';

export const getQueueExchangesRoute: RouteDefinition = {
  method: 'get',
  path: '/api/namespaces/:ns/queues/:name/exchanges',
  tags: ['Queue Exchanges'],
  operationId: 'getQueueExchanges',
  request: {
    path: getSchema('GetQueueExchangesControllerRequestPathDTO'),
  },
  response: getResponseSchemas('GetQueueExchangesControllerResponseDTO'),
  handler: getQueueExchanges,
};
