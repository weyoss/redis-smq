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
import { getMessageUnacknowledgementHistory } from './handler.js';

export const getMessageUnacknowledgementHistoryRoute: RouteDefinition = {
  method: 'get',
  path: '/api/messages/:id/unack-history',
  tags: ['Messages'],
  operationId: 'getMessageUnacknowledgementHistory',
  request: {
    path: getSchema(
      'GetMessageUnacknowledgementHistoryControllerRequestPathDTO',
    ),
  },
  response: getResponseSchemas(
    'GetMessageUnacknowledgementHistoryControllerResponseDTO',
  ),
  handler: getMessageUnacknowledgementHistory,
};
