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
import { getMessageById } from './handler.js';

export const getMessageByIdRoute: RouteDefinition = {
  method: 'get',
  path: '/api/messages/:id',
  tags: ['Messages'],
  operationId: 'getMessageById',
  request: {
    path: getSchema('GetMessageByIdControllerRequestPathDTO'),
  },
  response: getResponseSchemas('GetMessageByIdControllerResponseDTO'),
  handler: getMessageById,
};
