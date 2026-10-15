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
import { setQueueRateLimit } from './handler.js';

export const setQueueRateLimitRoute: RouteDefinition = {
  method: 'put',
  path: '/api/namespaces/:ns/queues/:name/rate-limit',
  tags: ['Rate limiting'],
  operationId: 'setQueueRateLimit',
  request: {
    path: getSchema('SetQueueRateLimitControllerRequestPathDTO'),
    body: getSchema('SetQueueRateLimitControllerRequestBodyDTO'),
  },
  response: getResponseSchemas('SetQueueRateLimitControllerResponseDTO'),
  handler: setQueueRateLimit,
};
