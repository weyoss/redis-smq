/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { Backoff } from './backoff.js';
import { ILogger } from '../logger/index.js';
import { IBackoffConfig } from './types/index.js';

export interface IExponentialBackoffConfig extends IBackoffConfig {
  factor?: number; // Multiplicative factor (default: 2)
}

export class ExponentialBackoff extends Backoff {
  private readonly factor: number;

  constructor(logger: ILogger, config: IExponentialBackoffConfig = {}) {
    super(logger, config);
    this.factor = config.factor ?? 2;
  }

  protected getNextDelay(baseDelay: number, attempts: number): number {
    return baseDelay * Math.pow(this.factor, attempts);
  }
}
