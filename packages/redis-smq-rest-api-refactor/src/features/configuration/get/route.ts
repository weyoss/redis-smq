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
import { getConfiguration } from './handler.js';

/**
 * `GET /api/config`
 *
 * No request body, no path parameters, no query parameters. The
 * `request` object is empty; the router compiles zero validators for
 * this route.
 *
 * The response schema is derived from the DTO type by name. The name
 * `'GetConfigurationControllerResponseDTO'` matches the file in this
 * folder, which `tsconfig.schema.json` picks up during codegen. If the
 * DTO is renamed and this string isn't updated, `getResponseSchemas`
 * throws at module load — a build-time failure, not a runtime one.
 */
export const getConfigurationRoute: RouteDefinition = {
  method: 'get',
  path: '/api/config',
  tags: ['Configuration'],
  operationId: 'getConfiguration',
  request: {},
  response: getResponseSchemas('GetConfigurationControllerResponseDTO'),
  handler: getConfiguration,
};
