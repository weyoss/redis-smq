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
import { cancelPurgeJob } from './handler.js';

export const cancelPurgeJobRoute: RouteDefinition = {
  method: 'delete',
  path: '/api/namespaces/:ns/queues/:name/purge/:messageStatus/:jobId',
  tags: ['Queue Purge'],
  operationId: 'cancelPurgeJob',
  request: {
    path: getSchema('CancelPurgeJobControllerRequestPathDTO'),
  },
  response: getResponseSchemas('CancelPurgeJobControllerResponseDTO'),
  handler: cancelPurgeJob,
};
