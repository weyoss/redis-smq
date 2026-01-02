/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { RedisSMQError } from '../../errors/index.js';

export class CommandNotSupportedError extends RedisSMQError<{
  command: string;
}> {
  getProps() {
    return {
      code: 'RedisSMQ.RedisClient.CommandNotSupported',
      defaultMessage:
        'Command not supported by your Redis server. Minimal required Redis server version is 6.2.0.',
    };
  }
}
