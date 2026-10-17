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
import { bindQueue } from './handler.js';

export const bindQueueRoute: RouteDefinition = {
  method: 'post',
  path: '/api/namespaces/:ns/exchanges/:exchange/bindings/:queue',
  tags: ['Namespace Exchanges'],
  operationId: 'bindQueue',
  request: {
    path: getSchema('BindQueueControllerRequestPathDTO'),
    query: getSchema('BindQueueControllerRequestQueryDTO'),
  },
  response: getResponseSchemas('BindQueueControllerResponseDTO'),
  handler: bindQueue,
};
