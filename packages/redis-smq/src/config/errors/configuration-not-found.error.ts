/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ConfigurationError } from './configuration.error.js';

export class ConfigurationNotFoundError extends ConfigurationError {
  constructor(namespace: string) {
    super(`No configuration found in Redis for namespace '${namespace}'`);
  }
}
