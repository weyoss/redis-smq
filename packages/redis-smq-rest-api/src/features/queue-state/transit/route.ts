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
import { transitQueueState } from './handler.js';

export const transitQueueStateRoute: RouteDefinition = {
  method: 'patch',
  path: '/api/namespaces/:ns/queues/:name/state',
  tags: ['Queue Operational State'],
  operationId: 'transitQueueState',
  request: {
    path: getSchema('TransitQueueStateControllerRequestPathDTO'),
    body: getSchema('TransitQueueStateControllerRequestBodyDTO'),
  },
  response: getResponseSchemas('TransitQueueStateControllerResponseDTO'),
  handler: transitQueueState,
};
