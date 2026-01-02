/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { RedisSMQError } from '../../errors/index.js';

export class RedisClientNotInstalledError extends RedisSMQError<{
  clientId: string;
}> {
  getProps() {
    return {
      code: 'RedisSMQ.RedisClient.ClientNotInstalled',
      defaultMessage:
        'REDIS client is not available. Please install your selected client first.',
    };
  }
}
