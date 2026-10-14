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
import { getBindings } from './handler.js';

export const getBindingsRoute: RouteDefinition = {
  method: 'get',
  path: '/api/namespaces/:ns/exchanges/:exchange/bindings',
  tags: ['Namespace Exchanges'],
  operationId: 'getBindings',
  request: {
    path: getSchema('GetBindingsControllerRequestPathDTO'),
    query: getSchema('GetBindingsControllerRequestQueryDTO'),
  },
  response: getResponseSchemas('GetBindingsControllerResponseDTO'),
  handler: getBindings,
};
