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
import { getNamespaceExchanges } from './handler.js';

export const getNamespaceExchangesRoute: RouteDefinition = {
  method: 'get',
  path: '/api/namespaces/:ns/exchanges',
  tags: ['Namespace Exchanges'],
  operationId: 'getNamespaceExchanges',
  request: {
    path: getSchema('GetNamespaceExchangesControllerRequestPathDTO'),
  },
  response: getResponseSchemas('GetNamespaceExchangesControllerResponseDTO'),
  handler: getNamespaceExchanges,
};
