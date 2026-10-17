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
import { unbindQueue } from './handler.js';

export const unbindQueueRoute: RouteDefinition = {
  method: 'delete',
  path: '/api/namespaces/:ns/exchanges/:exchange/bindings/:queue',
  tags: ['Namespace Exchanges'],
  operationId: 'unbindQueue',
  request: {
    path: getSchema('UnbindQueueControllerRequestPathDTO'),
    query: getSchema('UnbindQueueControllerRequestQueryDTO'),
  },
  response: getResponseSchemas('UnbindQueueControllerResponseDTO'),
  handler: unbindQueue,
};
