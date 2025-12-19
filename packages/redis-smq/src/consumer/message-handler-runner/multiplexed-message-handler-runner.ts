/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback, Timer } from 'redis-smq-common';
import { MessageHandler } from '../message-handler/message-handler.js';
import { MultiplexedMessageHandler } from '../message-handler/multiplexed-message-handler.js';
import { MessageHandlerRunner } from './message-handler-runner.js';
import { IConsumerMessageHandlerParams } from '../message-handler/types/index.js';
import { IConsumerContext } from '../types/consumer-context.js';

/**
 * MultiplexedMessageHandlerRunner schedules and rotates message handlers for multiple queues,
 * ensuring only one handler is active at a time and providing fair round-robin scheduling.
 */
export class MultiplexedMessageHandlerRunner extends MessageHandlerRunner {
  protected readonly multiplexingTickIntervalMs: number = 1000; // todo make it configurable: config.consumer.multiplexingTickIntervalMs
  protected schedulerTimer: Timer;
  protected index: number = 0;
  protected activeMessageHandler: MessageHandler | null = null;

  constructor(consumerContext: IConsumerContext) {
    super(consumerContext);
    this.schedulerTimer = new Timer();
    this.schedulerTimer.on('error', (err) => this.handleError(err));
  }

  /**
   * Schedules the next execution tick after the configured interval.
   * This is the single authoritative method for scheduling a delayed tick.
   */
  protected scheduleNextTick = (): void => {
    if (!this.isRunning()) return;
    this.schedulerTimer.reset();
    this.schedulerTimer.setTimeout(
      () => this.execNextMessageHandler(),
      this.multiplexingTickIntervalMs,
    );
  };

  /**
   * Returns the next message handler in round-robin order.
   */
  protected getNextMessageHandler(): MessageHandler | null {
    const count = this.messageHandlerInstances.length;
    if (count === 0) return null;
    if (this.index >= count) this.index = 0;
    const handler = this.messageHandlerInstances[this.index];
    this.index = (this.index + 1) % count;
    return handler;
  }

  /**
   * Executes the logic for a single tick. It iterates through available handlers
   * in a round-robin fashion to find one that is ready to run, then calls dequeue() on it.
   * If no handlers are ready, it schedules a delayed retry.
   */
  protected execNextMessageHandler = (): void => {
    if (!this.isRunning()) return;

    const totalHandlers = this.messageHandlerInstances.length;
    if (totalHandlers === 0) {
      this.scheduleNextTick();
      return;
    }

    // Iterate through handlers to find a runnable one without intermediate delays.
    for (let i = 0; i < totalHandlers; i += 1) {
      const handler = this.getNextMessageHandler();
      if (handler && handler.isRunning() && handler.isUp()) {
        this.activeMessageHandler = handler;
        this.activeMessageHandler.dequeue();
        // A runnable handler was found and activated. Exit until it calls back.
        return;
      }
    }

    // If we looped through all handlers and none were runnable, schedule a delayed tick.
    this.activeMessageHandler = null;
    this.scheduleNextTick();
  };

  /**
   * Creates a new MultiplexedMessageHandler instance for the given queue.
   */
  protected override createMessageHandlerInstance(
    handlerParams: IConsumerMessageHandlerParams,
  ): MessageHandler {
    // Pass scheduleNextTick to the handler. When a dequeue is empty or a message
    // is processed, it will schedule the next tick, preventing an infinite loop.
    const instance = new MultiplexedMessageHandler(
      this.consumerContext,
      handlerParams,
      this.scheduleNextTick,
    );
    instance.on('consumer.messageHandler.error', (err) => {
      this.logger.error(
        `MultiplexedMessageHandler [${instance.getId()}] has experienced a runtime error: ${err.message}. Shutting down instance. The supervisor will attempt to restart it.`,
      );
      this.shutdownMessageHandler(instance, () => {});
    });
    this.messageHandlerInstances.push(instance);
    this.logger.info(
      `Created MultiplexedMessageHandler (ID: ${instance.getId()}) for queue: ${
        handlerParams.queue.queueParams.name
      }. Total: ${this.messageHandlerInstances.length}`,
    );
    return instance;
  }

  /**
   * Shuts down a message handler and schedules the next tick if it was active.
   */
  protected override shutdownMessageHandler(
    messageHandler: MessageHandler,
    cb: ICallback<void>,
  ): void {
    const wasActive = messageHandler === this.activeMessageHandler;
    super.shutdownMessageHandler(messageHandler, () => {
      if (wasActive) {
        this.activeMessageHandler = null;
        // Use setTimeout to avoid immediate re-execution within the same call stack
        // and allow other shutdown operations to complete.
        setTimeout(() => this.execNextMessageHandler(), 0);
      }
      cb();
    });
  }

  /**
   * Starts the runner and kicks off the scheduling cycle.
   * The parent's `goingUp` sequence already calls `runMessageHandlers` and `reconcileHandlers`.
   */
  protected override goingUp(): ((cb: ICallback<void>) => void)[] {
    return super.goingUp().concat([
      (cb: ICallback<void>) => {
        // Start the cycle by executing the first tick immediately.
        this.execNextMessageHandler();
        cb();
      },
    ]);
  }

  /**
   * Stops the runner and resets the scheduler timer.
   */
  protected override goingDown(): ((cb: ICallback<void>) => void)[] {
    return [
      (cb: ICallback<void>) => {
        this.schedulerTimer.reset();
        cb();
      },
      // The parent's goingDown() sequence will handle shutting down handlers
      // and resetting the supervisor timer.
    ].concat(super.goingDown());
  }
}
