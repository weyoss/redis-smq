/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { RouteDefinition } from '../../../http/index.js';
import { getResponseSchemas } from '../../../http/index.js';
import { getExchanges } from './handler.js';

export const getExchangesRoute: RouteDefinition = {
  method: 'get',
  path: '/api/exchanges',
  tags: ['Exchanges'],
  operationId: 'getExchanges',
  request: {},
  response: getResponseSchemas('GetExchangesControllerResponseDTO'),
  handler: getExchanges,
};
