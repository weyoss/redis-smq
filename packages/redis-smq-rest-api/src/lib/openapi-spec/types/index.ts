/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { JSONSchema7 } from 'json-schema';
import { EControllerRequestPayload } from '../../controller/types/index.js';

export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface IOpenApiRouteParams {
  path: string;
  method: Lowercase<HTTPMethod>;
  requestParamsSchemas: Map<EControllerRequestPayload, JSONSchema7>;
  response: [number, JSONSchema7][];
  description?: string;
  tags?: string[];
}
