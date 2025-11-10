/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
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
  protected readonly tickIntervalMs: number = 1000; // todo make it configurable: config.consumer.multiplexingTickIntervalMs
  protected schedulerTimer: Timer;
  protected index: number = 0;
  protected activeMessageHandler: MessageHandler | null = null;

  constructor(consumerContext: IConsumerContext) {
    super(consumerContext);
    this.schedulerTimer = new Timer();
    this.schedulerTimer.on('error', (err) => this.handleError(err));
  }

  /**
   * Overrides the parent's reconciliation logic. The multiplexer has its own
   * scheduling mechanism ('scheduleNextTick') and does not rely on the
   * concurrent-safe supervisor from the parent class, which is incompatible
   * with the "one-at-a-time" multiplexing strategy.
   */
  protected override reconcileHandlers = (): void => {
    // Do nothing.
  };

  /**
   * Schedules the next execution tick after the configured interval.
   * This is the single authoritative method for scheduling.
   */
  protected scheduleNextTick = (): void => {
    if (!this.isRunning()) return;
    this.schedulerTimer.reset();
    this.schedulerTimer.setTimeout(
      () => this.execNextMessageHandler(),
      this.tickIntervalMs,
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
   * Executes the logic for a single tick: selecting one message handler and
   * attempting to dequeue a message from it.
   */
  protected execNextMessageHandler = (): void => {
    if (!this.isRunning()) return;
    this.activeMessageHandler = this.getNextMessageHandler();
    if (this.activeMessageHandler) {
      if (
        this.activeMessageHandler.isRunning() &&
        this.activeMessageHandler.isUp()
      ) {
        this.activeMessageHandler.dequeue();
      } else {
        this.scheduleNextTick();
      }
    } else {
      this.scheduleNextTick();
    }
  };

  /**
   * Creates a new MultiplexedMessageHandler instance for the given queue.
   */
  protected override createMessageHandlerInstance(
    handlerParams: IConsumerMessageHandlerParams,
  ): MessageHandler {
    // Pass scheduleNextTick to the handler. When a dequeue is empty,
    // it will schedule the next tick with a delay, preventing an infinite loop.
    const instance = new MultiplexedMessageHandler(
      this.consumerContext,
      handlerParams,
      this.scheduleNextTick,
    );
    this.messageHandlerInstances.push(instance);
    this.logger.info(
      `Created MultiplexedMessageHandler (ID: ${instance.getId()}) for queue: ${handlerParams.queue.queueParams.name}. Total: ${this.messageHandlerInstances.length}`,
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
        this.scheduleNextTick();
      }
      cb();
    });
  }

  /**
   * Starts the runner and kicks off the scheduling cycle.
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
   * Stops the runner and resets the timer.
   */
  protected override goingDown(): ((cb: ICallback<void>) => void)[] {
    this.schedulerTimer.reset();
    return super.goingDown();
  }
}
