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
  protected timer: Timer;
  protected index: number = 0;
  protected activeMessageHandler: MessageHandler | null = null;
  protected readonly tickIntervalMs: number = 1000;

  constructor(consumerContext: IConsumerContext) {
    super(consumerContext);
    this.logger.info(
      `Initializing MultiplexedMessageHandlerRunner with ID: ${this.id}`,
    );
    this.timer = new Timer();
    this.timer.on('error', (err) => {
      this.logger.error(`Timer error: ${err.message}`);
      this.handleError(err);
    });
    this.logger.debug('Timer initialized and error handler registered');
  }

  /**
   * Schedules the next execution tick after the configured interval.
   * This is the single authoritative method for scheduling.
   */
  protected scheduleNextTick = (): void => {
    if (!this.isRunning()) {
      this.logger.debug('scheduleNextTick called while not running, ignoring');
      return;
    }
    this.timer.reset(); // Always clear any previous timer
    this.logger.debug(
      `Scheduling next message handler execution in ${this.tickIntervalMs}ms`,
    );
    this.timer.setTimeout(
      () => this.execNextMessageHandler(),
      this.tickIntervalMs,
    );
  };

  /**
   * Returns the next message handler in round-robin order.
   * Handles index wrap-around and empty handler list.
   */
  protected getNextMessageHandler(): MessageHandler | null {
    const count = this.messageHandlerInstances.length;
    if (count === 0) {
      this.logger.debug('No message handlers registered');
      return null;
    }
    if (this.index >= count) {
      this.index = 0;
    }
    const handler = this.messageHandlerInstances[this.index];
    this.logger.debug(
      `Selected message handler at index ${this.index} (ID: ${handler?.getId?.() ?? 'N/A'})`,
    );
    // Advance index for next round
    this.index = (this.index + 1) % count;
    return handler;
  }

  /**
   * Executes the logic for a single tick: selecting one message handler and
   * attempting to dequeue a message from it.
   */
  protected execNextMessageHandler = (): void => {
    if (!this.isRunning()) {
      this.logger.debug(
        'execNextMessageHandler called while not running, ignoring',
      );
      return;
    }
    this.activeMessageHandler = this.getNextMessageHandler();
    if (this.activeMessageHandler) {
      if (
        this.activeMessageHandler.isRunning() &&
        this.activeMessageHandler.isUp()
      ) {
        this.logger.debug(
          `Triggering dequeue on active handler (ID: ${this.activeMessageHandler.getId()})`,
        );
        this.activeMessageHandler.dequeue();
      } else {
        this.logger.debug(
          `Active handler (ID: ${this.activeMessageHandler.getId()}) is not running, scheduling next tick`,
        );
        this.scheduleNextTick();
      }
    } else {
      this.logger.debug('No active handler available, scheduling next tick');
      this.scheduleNextTick();
    }
  };

  /**
   * Creates a new MultiplexedMessageHandler instance for the given queue.
   */
  protected override createMessageHandlerInstance(
    handlerParams: IConsumerMessageHandlerParams,
  ): MessageHandler {
    this.logger.debug(
      `Creating MultiplexedMessageHandler for queue: ${JSON.stringify(handlerParams.queue)}`,
    );
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
    const queue = messageHandler.getQueue();
    this.logger.debug(
      `Shutting down handler (ID: ${messageHandler.getId()}) for queue: ${JSON.stringify(queue)}`,
    );
    const wasActive = messageHandler === this.activeMessageHandler;
    super.shutdownMessageHandler(messageHandler, () => {
      if (wasActive) {
        this.logger.debug('Shut down active handler, scheduling next tick');
        this.scheduleNextTick();
      }
      cb();
    });
  }

  /**
   * Starts the runner and kicks off the scheduling cycle.
   */
  protected override goingUp(): ((cb: ICallback<void>) => void)[] {
    this.logger.info('MultiplexedMessageHandlerRunner going up');
    return super.goingUp().concat([
      (cb: ICallback<void>) => {
        this.logger.debug('Starting message handler execution cycle');
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
    this.logger.info('MultiplexedMessageHandlerRunner going down');
    this.logger.debug('Resetting timer during shutdown');
    this.timer.reset();
    return super.goingDown();
  }
}
