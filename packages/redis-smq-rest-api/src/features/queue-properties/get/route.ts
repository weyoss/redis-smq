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
import { getQueueProperties } from './handler.js';

export const getQueuePropertiesRoute: RouteDefinition = {
  method: 'get',
  path: '/api/namespaces/:ns/queues/:name',
  tags: ['Queue'],
  operationId: 'getQueueProperties',
  request: {
    path: getSchema('GetQueuePropertiesControllerRequestPathDTO'),
  },
  response: getResponseSchemas('GetQueuePropertiesControllerResponseDTO'),
  handler: getQueueProperties,
};
