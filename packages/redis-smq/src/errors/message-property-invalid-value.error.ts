/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IRedisSMQErrorProperties, RedisSMQError } from 'redis-smq-common';

export class MessagePropertyInvalidValueError extends RedisSMQError<{
  property: string;
  value: unknown;
}> {
  getProps(): IRedisSMQErrorProperties {
    return {
      code: 'RedisSMQ.Message.Property.InvalidValue',
      defaultMessage: 'Message property value is invalid.',
    };
  }
}
