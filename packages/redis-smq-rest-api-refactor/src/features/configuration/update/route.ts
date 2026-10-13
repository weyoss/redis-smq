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
import { updateConfiguration } from './handler.js';

/**
 * `PATCH /api/config`
 *
 * Declares a request body schema. The router compiles an AJV validator
 * from it at startup; requests with a body that doesn't match are
 * rejected with a `RequestValidationError` (400) before the handler
 * runs.
 *
 * The schema name `'UpdateConfigurationControllerRequestBodyDTO'`
 * resolves to the DTO file in this folder. If the DTO is renamed and
 * this string isn't, `getSchema` throws at module load.
 */
export const updateConfigurationRoute: RouteDefinition = {
  method: 'patch',
  path: '/api/config',
  tags: ['Configuration'],
  operationId: 'updateConfiguration',
  request: {
    body: getSchema('UpdateConfigurationControllerRequestBodyDTO'),
  },
  response: getResponseSchemas('UpdateConfigurationControllerResponseDTO'),
  handler: updateConfiguration,
};
