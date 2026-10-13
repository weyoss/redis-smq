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
import { getMessageStatus } from './handler.js';

export const getMessageStatusRoute: RouteDefinition = {
  method: 'get',
  path: '/api/messages/:id/status',
  tags: ['Messages'],
  operationId: 'getMessageStatus',
  request: {
    path: getSchema('GetMessageStatusControllerRequestPathDTO'),
  },
  response: getResponseSchemas('GetMessageStatusControllerResponseDTO'),
  handler: getMessageStatus,
};
