/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { RedisSMQError } from '../../errors/index.js';

/**
 * Namespaces must only contain alphanumeric characters, underscores, and hyphens.
 */
export class LoggerInvalidNamespaceError extends RedisSMQError {
  static override readonly code = 'RedisSMQ.Logger.InvalidNamespace';
  static override readonly defaultMessage =
    'Namespace must contain only alphanumeric characters, underscores, and hyphens.';
}
