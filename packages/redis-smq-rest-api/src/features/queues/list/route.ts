/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { RouteDefinition } from '../../../http/index.js';
import { getResponseSchemas } from '../../../http/index.js';
import { getAllQueues } from './handler.js';

export const getAllQueuesRoute: RouteDefinition = {
  method: 'get',
  path: '/api/queues',
  tags: ['Queues'],
  operationId: 'getAllQueues',
  request: {},
  response: getResponseSchemas('GetAllQueuesControllerResponseDTO'),
  handler: getAllQueues,
};
