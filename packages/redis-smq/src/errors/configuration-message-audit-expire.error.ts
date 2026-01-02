/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { RedisSMQError } from 'redis-smq-common';

export class ConfigurationMessageAuditExpireError extends RedisSMQError {
  getProps() {
    return {
      code: 'RedisSMQ.Configuration.MessageAuditExpire',
      defaultMessage: `Message audit 'expire' parameter is invalid. Expected a positive integer.`,
    };
  }
}
