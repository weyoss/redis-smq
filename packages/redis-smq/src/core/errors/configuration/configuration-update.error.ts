/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { RedisSMQError } from 'redis-smq-common';

/**
 * Indicates that an unexpected synchronous error was thrown during the execution
 * of a configuration step callback.
 */
export class ConfigurationUpdateError extends RedisSMQError {
  static override readonly code = 'RedisSMQ.Configuration.UpdateFailed';
  static override readonly defaultMessage =
    'An unexpected error occurred during configuration update.';
}
