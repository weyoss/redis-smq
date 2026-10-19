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
import { getPurgeJob } from './handler.js';

export const getPurgeJobRoute: RouteDefinition = {
  method: 'get',
  path: '/api/namespaces/:ns/queues/:name/messages/purge/:jobId',
  tags: ['Queue Messages'],
  operationId: 'getPurgeJob',
  request: {
    path: getSchema('GetPurgeJobControllerRequestPathDTO'),
    query: getSchema('GetPurgeJobControllerRequestQueryDTO'),
  },
  response: getResponseSchemas('GetPurgeJobControllerResponseDTO'),
  handler: getPurgeJob,
};
