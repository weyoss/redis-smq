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
  getProps() {
    return {
      code: 'RedisSMQRestApi.ResponseDTO.ResponseValidatorNotFound',
      defaultMessage: 'Response validator not found.',
    };
  }
}
