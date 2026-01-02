/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { RedisSMQRestApiError } from '../../lib/errors/errors/RedisSMQRestApiError.js';

export class InvalidApiServerParamsError extends RedisSMQRestApiError {
  getProps() {
    return {
      code: 'RedisSMQRestApi.Configuration.InvalidApiServerParams',
      defaultMessage: 'Invalid API server parameters.',
    };
  }
}
