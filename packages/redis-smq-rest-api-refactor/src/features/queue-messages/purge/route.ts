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
import { purgeQueueMessages } from './handler.js';

export const purgeQueueMessagesRoute: RouteDefinition = {
  method: 'delete',
  path: '/api/namespaces/:ns/queues/:name/messages',
  tags: ['Queue Messages'],
  operationId: 'purgeQueueMessages',
  request: {
    path: getSchema('PurgeQueueMessagesControllerRequestPathDTO'),
    query: getSchema('PurgeQueueMessagesControllerRequestQueryDTO'),
  },
  response: getResponseSchemas('PurgeQueueMessagesControllerResponseDTO'),
  handler: purgeQueueMessages,
};
