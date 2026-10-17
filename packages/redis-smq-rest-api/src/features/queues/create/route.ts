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
import { createQueue } from './handler.js';

export const createQueueRoute: RouteDefinition = {
  method: 'post',
  path: '/api/queues',
  tags: ['Queues'],
  operationId: 'createQueue',
  request: {
    body: getSchema('CreateQueueControllerRequestBodyDTO'),
  },
  response: getResponseSchemas('CreateQueueControllerResponseDTO'),
  handler: createQueue,
};
