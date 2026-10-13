/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { getResponseSchemas, RouteDefinition } from '../../../http/index.js';
import { getSchema } from '../../../http/index.js';
import { deleteMessagesByIds } from './handler.js';

export const deleteMessagesByIdsRoute: RouteDefinition = {
  method: 'delete',
  path: '/api/messages',
  tags: ['Messages'],
  operationId: 'deleteMessagesByIds',
  request: {
    query: getSchema('DeleteMessagesByIdsControllerRequestQueryDTO'),
  },
  response: getResponseSchemas('DeleteMessagesByIdsControllerResponseDTO'),
  handler: deleteMessagesByIds,
};
