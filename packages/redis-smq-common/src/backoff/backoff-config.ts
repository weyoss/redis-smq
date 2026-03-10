/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IBackoffConfig, IBackoffParsedConfig } from './types/index.js';

export class BackoffConfig {
  protected static config: IBackoffParsedConfig = {
    baseDelay: 1000, // Never retry faster than 1 second
    maxDelay: 60_000, // Never wait more than 1 min
    maxAttempts: 0, // Unlimited retries
    jitter: true,
  };

  static setDefaultConfig(config: IBackoffConfig) {
    this.config = this.parseConfig(config);
    return this.config;
  }

  static parseConfig(cfg: IBackoffConfig = {}): IBackoffParsedConfig {
    const config = {
      ...this.config,
      ...cfg,
    };

    const { baseDelay, maxDelay, jitter, maxAttempts } = config;

    if (baseDelay < this.config.baseDelay) {
      throw new Error(
        `baseDelay (${baseDelay}ms) is below minimum recommended (${this.config.baseDelay}ms)`,
      );
    }

    if (maxDelay > this.config.maxDelay) {
      throw new Error(
        `maxDelay (${maxDelay}ms) exceeds maximum allowed (${this.config.maxDelay}ms)`,
      );
    }

    if (baseDelay > maxDelay) {
      throw new Error(
        `baseDelay (${baseDelay}ms) cannot exceed maxDelay (${maxDelay}ms)`,
      );
    }

    if (maxAttempts < 0) {
      throw new Error(
        `maxAttempts (${maxAttempts}) cannot be a negative integer`,
      );
    }

    return { baseDelay, maxDelay, jitter, maxAttempts };
  }
}
