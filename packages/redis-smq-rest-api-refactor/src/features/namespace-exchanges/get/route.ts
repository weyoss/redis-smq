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
import { getExchange } from './handler.js';

export const getExchangeRoute: RouteDefinition = {
  method: 'get',
  path: '/api/namespaces/:ns/exchanges/:exchange',
  tags: ['Namespace Exchanges'],
  operationId: 'getExchange',
  request: {
    path: getSchema('GetExchangeControllerRequestPathDTO'),
  },
  response: getResponseSchemas('GetExchangeControllerResponseDTO'),
  handler: getExchange,
};
