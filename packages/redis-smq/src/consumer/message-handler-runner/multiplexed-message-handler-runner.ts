/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback, Timer } from 'redis-smq-common';
import { Consumer } from '../consumer.js';
import { MessageHandler } from '../message-handler/message-handler.js';
import { MultiplexedMessageHandler } from '../message-handler/multiplexed-message-handler.js';
import { MessageHandlerRunner } from './message-handler-runner.js';
import { IConsumerMessageHandlerParams } from '../message-handler/types/index.js';

/**
 * MultiplexedMessageHandlerRunner schedules and rotates message handlers for multiple queues,
 * ensuring only one handler is active at a time and providing fair round-robin scheduling.
 */
export class MultiplexedMessageHandlerRunner extends MessageHandlerRunner {
  protected timer: Timer;
  protected index: number = 0;
  protected activeMessageHandler: MessageHandler | null = null;
  protected readonly tickIntervalMs: number = 1000;

  constructor(consumer: Consumer) {
    super(consumer);
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
   * Schedules the next tick for message handler execution.
   * Ensures only one timer is active at a time.
   */
  protected nextTick(): void {
    if (!this.isRunning()) {
      this.logger.debug('nextTick called while not running, ignoring');
      return;
    }
    this.activeMessageHandler = null;
    this.timer.reset(); // Always clear any previous timer
    this.logger.debug(
      `Scheduling next message handler execution in ${this.tickIntervalMs}ms`,
    );
    this.timer.setTimeout(
      () => this.execNextMessageHandler(),
      this.tickIntervalMs,
    );
  }

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
   * Executes the next message handler in the rotation.
   * If the handler is running, triggers dequeue; otherwise, schedules the next tick.
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
        this.nextTick();
      }
    } else {
      this.logger.debug('No active handler available, scheduling next tick');
      this.nextTick();
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
    const instance = new MultiplexedMessageHandler(
      this.consumer,
      handlerParams,
      this.execNextMessageHandler,
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
    super.shutdownMessageHandler(messageHandler, () => {
      if (messageHandler === this.activeMessageHandler) {
        this.logger.debug('Shut down active handler, scheduling next tick');
        this.nextTick();
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
