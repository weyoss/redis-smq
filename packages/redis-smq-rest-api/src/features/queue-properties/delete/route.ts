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
import { deleteQueue } from './handler.js';

export const deleteQueueRoute: RouteDefinition = {
  method: 'delete',
  path: '/api/namespaces/:ns/queues/:name',
  tags: ['Queue'],
  operationId: 'deleteQueue',
  request: {
    path: getSchema('DeleteQueueControllerRequestPathDTO'),
  },
  response: getResponseSchemas('DeleteQueueControllerResponseDTO'),
  handler: deleteQueue,
};
