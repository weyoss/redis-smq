/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IRedisSMQErrorProperties, RedisSMQError } from 'redis-smq-common';

export class UnexpectedScriptReplyError extends RedisSMQError<{
  reply: unknown;
}> {
  getProps(): IRedisSMQErrorProperties {
    return {
      code: 'RedisSMQ.MessageHandler.UnexpectedScriptReply',
      defaultMessage: 'Redis script returned an unexpected reply type.',
    };
  }
}
