/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { EventBusNotConnectedError } from './errors/index.js';
import { IEventBusConfig, TEventBusEvent } from './types/index.js';
import { Runnable } from '../runnable/index.js';
import { createLogger, ILogger } from '../logger/index.js';
import { ICallback } from '../async/index.js';

/**
 * EventBus
 * - Keeps listener management simple: delegate to base EventEmitter without extra guards
 * - Only validates running state when emitting non-error events
 * - Ensures listeners are cleared on shutdown
 */
export class EventBus<Events extends TEventBusEvent> extends Runnable<Events> {
  private readonly logger: ILogger;

  constructor(config: IEventBusConfig = {}) {
    super();
    this.logger = createLogger(config?.logger);
  }

  protected override getLogger(): ILogger {
    return this.logger;
  }

  /**
   * Emit an event.
   * - 'error' events are always emitted locally.
   * - Non-error events require the bus to be running; otherwise an error is emitted and false is returned.
   */
  override emit<E extends keyof Events>(
    event: E,
    ...args: Parameters<Events[E]>
  ): boolean {
    if (event === 'error') {
      return super.emit(event, ...args);
    }
    if (!this.isRunning()) {
      this.eventEmitter.emit('error', new EventBusNotConnectedError());
      return false;
    }
    return super.emit(event, ...args);
  }

  /**
   * Ensure all listeners are removed on shutdown.
   */
  protected override goingDown(): ((cb: ICallback<void>) => void)[] {
    return [
      (cb: ICallback<void>) => {
        super.removeAllListeners();
        cb();
      },
    ].concat(super.goingDown());
  }
}
