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
import { deleteMessageById } from './handler.js';

export const deleteMessageByIdRoute: RouteDefinition = {
  method: 'delete',
  path: '/api/messages/:id',
  tags: ['Messages'],
  operationId: 'deleteMessageById',
  request: {
    path: getSchema('DeleteMessageByIdControllerRequestPathDTO'),
  },
  response: getResponseSchemas('DeleteMessageByIdControllerResponseDTO'),
  handler: deleteMessageById,
};
