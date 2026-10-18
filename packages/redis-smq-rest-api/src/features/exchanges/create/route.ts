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
import { createExchange } from './handler.js';

export const createExchangeRoute: RouteDefinition = {
  method: 'post',
  path: '/api/exchanges',
  tags: ['Exchanges'],
  operationId: 'createExchange',
  request: {
    body: getSchema('CreateExchangeControllerRequestBodyDTO'),
  },
  response: getResponseSchemas('CreateExchangeControllerResponseDTO'),
  handler: createExchange,
};
