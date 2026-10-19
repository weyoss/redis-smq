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
import { cancelPurge } from './handler.js';

export const cancelPurgeRoute: RouteDefinition = {
  method: 'delete',
  path: '/api/namespaces/:ns/queues/:name/messages/purge/:jobId',
  tags: ['Queue Messages'],
  operationId: 'cancelPurge',
  request: {
    path: getSchema('CancelPurgeControllerRequestPathDTO'),
    query: getSchema('CancelPurgeControllerRequestQueryDTO'),
  },
  response: getResponseSchemas('CancelPurgeControllerResponseDTO'),
  handler: cancelPurge,
};
