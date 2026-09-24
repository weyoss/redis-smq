/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { RedisSMQError } from '../../errors/index.js';

export class EventBusMessageJSONParseError extends RedisSMQError<{
  error: string;
}> {
  static override readonly code = 'RedisSMQ.EventBus.MessageJSONParseFailed';
  static override readonly defaultMessage =
    'Failed to parse an incoming message from the event bus.';
}
