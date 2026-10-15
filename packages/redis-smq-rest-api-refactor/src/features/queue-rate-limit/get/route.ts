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
import { getQueueRateLimit } from './handler.js';

export const getQueueRateLimitRoute: RouteDefinition = {
  method: 'get',
  path: '/api/namespaces/:ns/queues/:name/rate-limit',
  tags: ['Rate limiting'],
  operationId: 'getQueueRateLimit',
  request: {
    path: getSchema('GetQueueRateLimitControllerRequestPathDTO'),
  },
  response: getResponseSchemas('GetQueueRateLimitControllerResponseDTO'),
  handler: getQueueRateLimit,
};
