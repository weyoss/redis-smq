/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback, ILogger, Timer } from 'redis-smq-common';
import { MessageHandler } from './message-handler.js';

/**
 * Round-robin scheduler for multiplexed consumers.
 *
 * In multiplexed mode, a single tick loop drives every handler: at each
 * tick, the controller picks the next operational handler whose queue is
 * active and calls `dequeue()` on it. The handler processes one message
 * (or finds the queue empty) and yields control back to the controller
 * by calling the `next` callback that was passed to it at construction.
 *
 * This replaces the class-per-mode design of MessageHandlerRunner +
 * MultiplexedMessageHandlerRunner. The scheduling policy lives here; the
 * runner owns the handler instances and their lifecycle.
 *
 * The controller does not know about the handler hierarchy or the
 * registry. It asks for the current handler list and the "queue active"
 * predicate through callbacks supplied by the runner.
 */
export class MultiplexingController {
  private readonly tickIntervalMs: number;
  private readonly timer: Timer;
  private index = 0;
  private activeHandler: MessageHandler | null = null;

  constructor(
    private readonly logger: ILogger,
    tickIntervalMs: number,
    private readonly getHandlers: () => readonly MessageHandler[],
    private readonly isHandlerQueueActive: (handler: MessageHandler) => boolean,
  ) {
    this.timer = new Timer(logger);
    this.tickIntervalMs = tickIntervalMs;
  }

  run(cb: ICallback): void {
    this.timer.run(cb);
  }

  shutdown(cb: ICallback): void {
    this.activeHandler = null;
    this.timer.shutdown(cb);
  }

  /**
   * Called by the runner after a handler instance is torn down. If that
   * handler was the currently active one, clear the reference and pick
   * the next operational handler on the next event-loop turn.
   *
   * The tick is deferred via setImmediate so it does not re-enter the
   * handler's own shutdown call stack.
   */
  onHandlerStopped(handler: MessageHandler): void {
    if (handler !== this.activeHandler) return;
    this.activeHandler = null;
    setImmediate(() => {
      // The runner may have shut down between the setImmediate call and
      // this callback firing. Bail out if that happened.
      if (this.activeHandler === null && this.timer.isRunning()) {
        this.execNextTick();
      }
    });
  }

  /**
   * Schedule the next tick. This is the callback the handler receives as
   * its `nextFn` and calls when it is done with the current message (or
   * found the queue empty).
   */
  scheduleNextTick = (): void => {
    this.timer.reset();
    this.timer.schedule(this.execNextTick, this.tickIntervalMs);
  };

  /**
   * Perform one tick: pick the next operational handler whose queue is
   * active, and call `dequeue()` on it. If no such handler exists, wait
   * for the next tick.
   */
  execNextTick = (): void => {
    const handlers = this.getHandlers();
    if (handlers.length === 0) {
      this.activeHandler = null;
      this.scheduleNextTick();
      return;
    }

    for (let i = 0; i < handlers.length; i += 1) {
      const handler = this.getNextHandler(handlers);
      if (!handler) continue;
      if (!handler.isOperational() || !handler.isUp()) continue;
      if (!this.isHandlerQueueActive(handler)) continue;

      this.activeHandler = handler;
      handler.dequeue();
      return;
    }

    this.activeHandler = null;
    this.scheduleNextTick();
  };

  private getNextHandler(
    handlers: readonly MessageHandler[],
  ): MessageHandler | null {
    if (handlers.length === 0) return null;
    if (this.index >= handlers.length) this.index = 0;
    const handler = handlers[this.index];
    this.index = (this.index + 1) % handlers.length;
    return handler ?? null;
  }
}
