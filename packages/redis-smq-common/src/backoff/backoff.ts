/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback } from '../async/index.js';
import { Runnable } from '../runnable/index.js';
import { ILogger } from '../logger/index.js';
import { AbortError } from '../errors/index.js';
import { Timer } from '../timer/index.js';
import { IBackoffConfig, IBackoffParsedConfig } from './types/index.js';
import { BackoffConfig } from './backoff-config.js';

export abstract class Backoff extends Runnable {
  private timer: Timer;
  protected readonly config: IBackoffParsedConfig;
  protected readonly logger: ILogger;
  protected attempts = 0;

  constructor(logger: ILogger, config: IBackoffConfig = {}) {
    super();
    this.logger = logger.createLogger(this.constructor.name);
    this.config = BackoffConfig.parseConfig(config);
    this.timer = new Timer(this.logger);

    this.logger.debug(
      `Backoff initialized: baseDelay=${this.config.baseDelay}ms, maxDelay=${this.config.maxDelay}ms`,
    );
  }

  protected runTask<TResult>(
    task: (cb: ICallback<TResult>) => void,
    callback: ICallback<TResult>,
  ): void {
    if (!this.isOperational()) {
      return callback(new Error('Backoff is not operational'));
    }

    this.attempts++;

    task((err, result) => {
      if (err) {
        if (err instanceof AbortError) {
          return callback(err);
        }

        this.logger.debug(`Operation failed:`, err.message);

        if (
          this.config.maxAttempts &&
          this.attempts >= this.config.maxAttempts
        ) {
          return callback(err);
        }

        this.scheduleRetry(task, callback);
        return;
      }

      this.reset();
      callback(null, result);
    });
  }

  protected scheduleRetry<TResult>(
    task: (cb: ICallback<TResult>) => void,
    callback: ICallback<TResult>,
  ): void {
    if (!this.isOperational()) {
      return callback(new Error('Backoff is not operational'));
    }

    const delay = this.calculateNextDelay();
    this.timer.schedule(() => {
      this.runTask(task, callback);
    }, delay);
  }

  protected calculateNextDelay(): number {
    const { baseDelay, maxDelay, jitter } = this.config;

    let delay = this.getNextDelay(baseDelay, this.attempts);

    // Ensures delay never goes below baseDelay
    delay = Math.max(delay, baseDelay);

    // Add jitter (±20%) to avoid thundering herd
    if (jitter) {
      const range = delay * 0.2;
      delay = delay + (Math.random() * range * 2 - range);
    }

    // Apply delay cap
    delay = Math.min(delay, maxDelay);

    return Math.max(1, Math.floor(delay));
  }

  protected abstract getNextDelay(baseDelay: number, attempts: number): number;

  /**
   * Runnable lifecycle hooks
   */
  protected override goingUp(): Array<(cb: ICallback<void>) => void> {
    return super.goingUp().concat([(cb) => this.timer.run(cb)]);
  }

  protected override goingDown(): Array<(cb: ICallback<void>) => void> {
    return [
      (cb: ICallback) => {
        this.reset();
        this.timer.shutdown(cb);
      },
    ].concat(super.goingDown());
  }

  getConfig(): IBackoffParsedConfig {
    return { ...this.config };
  }

  /**
   * Execute a task with backoff retry
   */
  execute<TResult>(
    task: (cb: ICallback<TResult>) => void,
    callback: ICallback<TResult>,
  ): void {
    if (!this.isOperational()) {
      return callback(new Error('Backoff instance is not operational'));
    }

    this.runTask(task, callback);
  }

  /**
   *
   */
  getAttempts(): number {
    return this.attempts;
  }

  /**
   * Reset backoff state
   */
  reset(): void {
    this.timer.reset();
    this.attempts = 0;
  }
}
