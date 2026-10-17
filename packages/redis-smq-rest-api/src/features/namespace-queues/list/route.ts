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
import { getNamespaceQueues } from './handler.js';

export const getNamespaceQueuesRoute: RouteDefinition = {
  method: 'get',
  path: '/api/namespaces/:ns/queues',
  tags: ['Namespace Queues'],
  operationId: 'getNamespaceQueues',
  request: {
    path: getSchema('GetNamespaceQueuesControllerRequestPathDTO'),
  },
  response: getResponseSchemas('GetNamespaceQueuesControllerResponseDTO'),
  handler: getNamespaceQueues,
};
