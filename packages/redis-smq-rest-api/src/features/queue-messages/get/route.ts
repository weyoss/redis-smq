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
import { getQueueMessages } from './handler.js';

export const getQueueMessagesRoute: RouteDefinition = {
  method: 'get',
  path: '/api/namespaces/:ns/queues/:name/messages',
  tags: ['Queue Messages'],
  operationId: 'getQueueMessages',
  request: {
    path: getSchema('GetQueueMessagesControllerRequestPathDTO'),
    query: getSchema('GetQueueMessagesControllerRequestQueryDTO'),
  },
  response: getResponseSchemas('GetQueueMessagesControllerResponseDTO'),
  handler: getQueueMessages,
};
