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
import { getMessagesByIds } from './handler.js';

export const getMessagesByIdsRoute: RouteDefinition = {
  method: 'get',
  path: '/api/messages',
  tags: ['Messages'],
  operationId: 'getMessagesByIds',
  request: {
    query: getSchema('GetMessagesByIdsControllerRequestQueryDTO'),
  },
  response: getResponseSchemas('GetMessagesByIdsControllerResponseDTO'),
  handler: getMessagesByIds,
};
