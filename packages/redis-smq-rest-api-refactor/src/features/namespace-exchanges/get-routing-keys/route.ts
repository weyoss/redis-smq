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
import { getRoutingKeys } from './handler.js';

export const getRoutingKeysRoute: RouteDefinition = {
  method: 'get',
  path: '/api/namespaces/:ns/exchanges/:exchange/routing-keys',
  tags: ['Namespace Exchanges'],
  operationId: 'getRoutingKeys',
  request: {
    path: getSchema('GetRoutingKeysControllerRequestPathDTO'),
  },
  response: getResponseSchemas('GetRoutingKeysControllerResponseDTO'),
  handler: getRoutingKeys,
};
