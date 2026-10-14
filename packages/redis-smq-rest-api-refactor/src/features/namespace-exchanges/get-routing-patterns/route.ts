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
import { getRoutingPatterns } from './handler.js';

export const getRoutingPatternsRoute: RouteDefinition = {
  method: 'get',
  path: '/api/namespaces/:ns/exchanges/:exchange/routing-patterns',
  tags: ['Namespace Exchanges'],
  operationId: 'getRoutingPatterns',
  request: {
    path: getSchema('GetRoutingPatternsControllerRequestPathDTO'),
  },
  response: getResponseSchemas('GetRoutingPatternsControllerResponseDTO'),
  handler: getRoutingPatterns,
};
