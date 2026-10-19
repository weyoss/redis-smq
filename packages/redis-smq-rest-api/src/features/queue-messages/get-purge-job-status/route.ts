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
import { getPurgeJobStatus } from './handler.js';

export const getPurgeJobStatusRoute: RouteDefinition = {
  method: 'get',
  path: '/api/namespaces/:ns/queues/:name/messages/purge/:jobId/status',
  tags: ['Queue Messages'],
  operationId: 'getPurgeJobStatus',
  request: {
    path: getSchema('GetPurgeJobStatusControllerRequestPathDTO'),
    query: getSchema('GetPurgeJobStatusControllerRequestQueryDTO'),
  },
  response: getResponseSchemas('GetPurgeJobStatusControllerResponseDTO'),
  handler: getPurgeJobStatus,
};
