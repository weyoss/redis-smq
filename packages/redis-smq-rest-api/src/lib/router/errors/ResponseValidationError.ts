/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { RedisSMQRestApiError } from '../../errors/errors/RedisSMQRestApiError.js';
import { ErrorObject } from 'ajv';

export class ResponseValidationError extends RedisSMQRestApiError<{
  errorObjects: Partial<ErrorObject>[];
}> {
  static override readonly code =
    'RedisSMQRestApi.ResponseDTO.ValidationFailed';
  static override readonly defaultMessage = 'Response validation failed.';
}
