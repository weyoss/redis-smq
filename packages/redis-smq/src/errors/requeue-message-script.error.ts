/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IRedisSMQErrorProperties, RedisSMQError } from 'redis-smq-common';

/**
 * Indicates that the 'requeue' Lua script returned an error string,
 * signaling a failure within the script itself.
 */
export class RequeueMessageScriptError extends RedisSMQError<{
  scriptReply: string;
}> {
  getProps(): IRedisSMQErrorProperties {
    return {
      code: 'RedisSMQ.Message.RequeueMessageScriptError',
      defaultMessage: 'Failed to requeue message due to a LUA script error.',
    };
  }
}
