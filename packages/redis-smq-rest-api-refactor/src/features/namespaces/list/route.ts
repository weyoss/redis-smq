/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { RouteDefinition } from '../../../http/index.js';
import { getResponseSchemas } from '../../../http/index.js';
import { getNamespaces } from './handler.js';

export const getNamespacesRoute: RouteDefinition = {
  method: 'get',
  path: '/api/namespaces',
  tags: ['Namespaces'],
  operationId: 'getNamespaces',
  request: {},
  response: getResponseSchemas('GetNamespacesControllerResponseDTO'),
  handler: getNamespaces,
};
