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
import { getMessageIds } from './handler.js';

export const getMessageIdsRoute: RouteDefinition = {
  method: 'get',
  path: '/api/namespaces/:ns/queues/:name/messages/ids',
  tags: ['Queue Messages'],
  operationId: 'getMessageIds',
  request: {
    path: getSchema('GetMessageIdsControllerRequestPathDTO'),
    query: getSchema('GetMessageIdsControllerRequestQueryDTO'),
  },
  response: getResponseSchemas('GetMessageIdsControllerResponseDTO'),
  handler: getMessageIds,
};
