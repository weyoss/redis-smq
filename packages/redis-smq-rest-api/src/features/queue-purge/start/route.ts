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
import { startPurge } from './handler.js';

export const startPurgeRoute: RouteDefinition = {
  method: 'delete',
  path: '/api/namespaces/:ns/queues/:name/purge/:messageStatus',
  tags: ['Queue Purge'],
  operationId: 'startPurge',
  request: {
    path: getSchema('StartPurgeControllerRequestPathDTO'),
  },
  response: getResponseSchemas('StartPurgeControllerResponseDTO'),
  handler: startPurge,
};
