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
import { countQueueMessages } from './handler.js';

export const countQueueMessagesRoute: RouteDefinition = {
  method: 'get',
  path: '/api/namespaces/:ns/queues/:name/messages/count',
  tags: ['Queue Messages'],
  operationId: 'countQueueMessages',
  request: {
    path: getSchema('CountQueueMessagesControllerRequestPathDTO'),
    query: getSchema('CountQueueMessagesControllerRequestQueryDTO'),
  },
  response: getResponseSchemas('CountQueueMessagesControllerResponseDTO'),
  handler: countQueueMessages,
};
