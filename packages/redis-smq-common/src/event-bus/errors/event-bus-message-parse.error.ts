/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { RedisSMQError } from '../../errors/index.js';
import { IRedisSMQErrorProperties } from '../../errors/types/index.js';

/**
 * Indicates that an incoming message from the event bus could not be parsed as JSON.
 */
export class EventBusMessageJSONParseError extends RedisSMQError<{
  error: string;
}> {
  getProps(): IRedisSMQErrorProperties {
    return {
      code: 'RedisSMQ.EventBus.MessageJSONParse.Failed',
      defaultMessage: 'Failed to parse an incoming message from the event bus.',
    };
  }
}
