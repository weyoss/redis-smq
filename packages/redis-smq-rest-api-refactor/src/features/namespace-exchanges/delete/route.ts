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
import { deleteExchange } from './handler.js';

export const deleteExchangeRoute: RouteDefinition = {
  method: 'delete',
  path: '/api/namespaces/:ns/exchanges/:exchange',
  tags: ['Namespace Exchanges'],
  operationId: 'deleteExchange',
  request: {
    path: getSchema('DeleteExchangeControllerRequestPathDTO'),
  },
  response: getResponseSchemas('DeleteExchangeControllerResponseDTO'),
  handler: deleteExchange,
};
