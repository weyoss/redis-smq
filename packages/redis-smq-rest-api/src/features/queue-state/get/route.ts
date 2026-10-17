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
import { getQueueState } from './handler.js';

export const getQueueStateRoute: RouteDefinition = {
  method: 'get',
  path: '/api/namespaces/:ns/queues/:name/state',
  tags: ['Queue Operational State'],
  operationId: 'getQueueState',
  request: {
    path: getSchema('GetQueueStateControllerRequestPathDTO'),
  },
  response: getResponseSchemas('GetQueueStateControllerResponseDTO'),
  handler: getQueueState,
};
