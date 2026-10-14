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
import { getQueueStateHistory } from './handler.js';

export const getQueueStateHistoryRoute: RouteDefinition = {
  method: 'get',
  path: '/api/namespaces/:ns/queues/:name/state/history',
  tags: ['Queue Operational State'],
  operationId: 'getQueueStateHistory',
  request: {
    path: getSchema('GetQueueStateHistoryControllerRequestPathDTO'),
  },
  response: getResponseSchemas('GetQueueStateHistoryControllerResponseDTO'),
  handler: getQueueStateHistory,
};
