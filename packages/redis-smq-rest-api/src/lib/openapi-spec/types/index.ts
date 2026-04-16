/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { JSONSchema7 } from 'json-schema';
import { ERequestMethod, ERequestPayload } from '../../types/controller.js';

export interface IOpenApiRouteParams {
  path: string;
  method: Lowercase<ERequestMethod>;
  requestParamsSchemas: Map<ERequestPayload, JSONSchema7>;
  response: [number, JSONSchema7][];
  description?: string;
  tags?: string[];
}
