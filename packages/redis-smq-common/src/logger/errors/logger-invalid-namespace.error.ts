/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IRedisSMQErrorProperties } from '../../errors/types/index.js';
import { RedisSMQError } from '../../errors/index.js';

/**
 * Indicates that a logger namespace contains invalid characters.
 * Namespaces must only contain alphanumeric characters, underscores, and hyphens.
 */
export class LoggerInvalidNamespaceError extends RedisSMQError {
  getProps(): IRedisSMQErrorProperties {
    return {
      code: 'RedisSMQ.Logger.InvalidNamespace',
      defaultMessage:
        'Namespace must contain only alphanumeric characters, underscores, and hyphens.',
    };
  }
}
