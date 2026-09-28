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
  static override readonly code = 'RedisSMQ.Configuration.MessageAuditExpire';
  static override readonly defaultMessage =
    "Message audit 'expire' parameter is invalid. Expected a positive integer.";
}
