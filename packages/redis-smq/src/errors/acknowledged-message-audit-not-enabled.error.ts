/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IRedisSMQErrorProperties, RedisSMQError } from 'redis-smq-common';

export class AcknowledgedMessageAuditNotEnabledError extends RedisSMQError {
  getProps(): IRedisSMQErrorProperties {
    return {
      code: 'RedisSMQ.Message.AcknowledgedMessageAuditNotEnabled',
      defaultMessage: 'Message acknowledgment audit is not enabled.',
    };
  }
}
