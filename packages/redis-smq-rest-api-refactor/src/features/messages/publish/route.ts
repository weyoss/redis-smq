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
import { publishMessage } from './handler.js';

export const publishMessageRoute: RouteDefinition = {
  method: 'post',
  path: '/api/messages',
  tags: ['Messages'],
  operationId: 'publishMessage',
  request: {
    body: getSchema('PublishMessageControllerRequestBodyDTO'),
  },
  response: getResponseSchemas('PublishMessageControllerResponseDTO'),
  handler: publishMessage,
};
