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
import { deleteNamespace } from './handler.js';

export const deleteNamespaceRoute: RouteDefinition = {
  method: 'delete',
  path: '/api/namespaces/:ns',
  tags: ['Namespaces'],
  operationId: 'deleteNamespace',
  request: {
    path: getSchema('DeleteNamespaceControllerRequestPathDTO'),
  },
  response: getResponseSchemas('DeleteNamespaceControllerResponseDTO'),
  handler: deleteNamespace,
};
