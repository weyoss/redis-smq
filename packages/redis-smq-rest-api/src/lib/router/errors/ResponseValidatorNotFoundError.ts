/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { RedisSMQRestApiError } from '../../errors/errors/RedisSMQRestApiError.js';

export class ResponseValidatorNotFoundError extends RedisSMQRestApiError {
  static override readonly code =
    'RedisSMQRestApi.ResponseDTO.ResponseValidatorNotFound';
  static override readonly defaultMessage = 'Response validator not found.';
}
