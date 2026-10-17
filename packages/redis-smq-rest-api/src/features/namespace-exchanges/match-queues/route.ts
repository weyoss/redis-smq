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
import { matchQueues } from './handler.js';

export const matchQueuesRoute: RouteDefinition = {
  method: 'get',
  path: '/api/namespaces/:ns/exchanges/:exchange/match',
  tags: ['Namespace Exchanges'],
  operationId: 'matchQueues',
  request: {
    path: getSchema('MatchQueuesControllerRequestPathDTO'),
    query: getSchema('MatchQueuesControllerRequestQueryDTO'),
  },
  response: getResponseSchemas('MatchQueuesControllerResponseDTO'),
  handler: matchQueues,
};
