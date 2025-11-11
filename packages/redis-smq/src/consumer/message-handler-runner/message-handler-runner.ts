/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { async, ICallback, ILogger, Runnable, Timer } from 'redis-smq-common';
import { TConsumerMessageHandlerRunnerEvent } from '../../common/index.js';
import { IQueueParsedParams } from '../../queue-manager/index.js';
import { MessageHandlerAlreadyExistsError } from '../../errors/index.js';
import { MessageHandler } from '../message-handler/message-handler.js';
import { eventBusPublisher } from './event-bus-publisher.js';
import {
  IConsumerMessageHandlerParams,
  TConsumerMessageHandler,
} from '../message-handler/types/index.js';
import { IConsumerContext } from '../types/consumer-context.js';

/**
 * Manages the lifecycle of message handlers for a consumer, including
 * adding, removing, starting, and shutting down handlers for specific queues.
 * It also includes a supervisor mechanism to automatically restart handlers
 * that fail during runtime.
 */
export class MessageHandlerRunner extends Runnable<TConsumerMessageHandlerRunnerEvent> {
  protected readonly handlerReconciliationInterval = 5000; // todo: make it configurable: config.consumer.handlerReconciliationInterval
  protected readonly consumerContext: IConsumerContext;
  protected readonly logger: ILogger;
  protected readonly supervisorTimer: Timer;

  protected messageHandlerInstances: MessageHandler[] = [];
  protected messageHandlers: IConsumerMessageHandlerParams[] = [];

  constructor(consumerContext: IConsumerContext) {
    super();
    this.consumerContext = consumerContext;
    this.logger = this.consumerContext.logger;
    if (this.consumerContext.config.eventBus.enabled) {
      eventBusPublisher(this);
    }
    this.supervisorTimer = new Timer();
    this.supervisorTimer.on('error', (err) => this.handleError(err));
    this.logger.info(`MessageHandlerRunner with ID: ${this.id} initialized.`);
  }

  /**
   * Generates a unique, consistent identifier for a queue configuration.
   */
  protected getQueueIdentifier(queue: IQueueParsedParams): string {
    return `${queue.queueParams.ns}:${queue.queueParams.name}:${
      queue.groupId ?? ''
    }`;
  }

  /**
   * Checks if two queue parameter objects represent the same queue.
   */
  protected isSameQueue(
    q1: IQueueParsedParams,
    q2: IQueueParsedParams,
  ): boolean {
    return this.getQueueIdentifier(q1) === this.getQueueIdentifier(q2);
  }

  /**
   * Schedules the next reconciliation check.
   */
  protected scheduleReconciliation = (): void => {
    if (this.isRunning()) {
      this.supervisorTimer.setTimeout(
        this.reconcileHandlers,
        this.handlerReconciliationInterval,
      );
    }
  };

  /**
   * The supervisor loop. Periodically checks for configurations that do not
   * have a running instance and attempts to restart them sequentially.
   */
  protected reconcileHandlers = (): void => {
    if (!this.isRunning()) return;

    this.logger.debug('Running handler reconciliation...');
    const runningQueues = new Set(
      this.messageHandlerInstances.map((i) =>
        this.getQueueIdentifier(i.getQueue()),
      ),
    );

    const zombieHandlers = this.messageHandlers.filter(
      (i) => !runningQueues.has(this.getQueueIdentifier(i.queue)),
    );

    if (zombieHandlers.length > 0) {
      this.logger.warn(
        `Found ${zombieHandlers.length} zombie handler(s). Attempting to restart sequentially...`,
      );
      const tasks = zombieHandlers.map((handlerParams) => {
        return (done: ICallback<void>) => {
          // Re-validate state at the last moment to prevent a race condition
          // where a handler is removed while reconciliation is in progress.
          if (!this.getMessageHandler(handlerParams.queue)) {
            this.logger.warn(
              `Handler for queue ${handlerParams.queue.queueParams.name} was removed during reconciliation. Skipping restart.`,
            );
            return done();
          }

          this.logger.debug(
            `Reconciling handler for queue: ${handlerParams.queue.queueParams.name}`,
          );
          this.runMessageHandler(handlerParams, (err) => {
            if (err) {
              this.logger.error(
                `Failed to restart zombie handler for queue ${handlerParams.queue.queueParams.name}.`,
              );
            }
            // We call done() without an error to allow the series to continue with the next handler.
            done();
          });
        };
      });
      async.series(tasks, () => {
        this.logger.debug('Finished reconciliation series for this tick.');
        this.scheduleReconciliation();
      });
    } else {
      this.logger.debug('No zombie handlers found.');
      this.scheduleReconciliation();
    }
  };

  removeMessageHandler(queue: IQueueParsedParams, cb: ICallback<void>): void {
    const handler = this.getMessageHandler(queue);
    if (!handler) {
      return cb();
    }
    this.messageHandlers = this.messageHandlers.filter(
      (h) => !this.isSameQueue(h.queue, queue),
    );
    const handlerInstance = this.getMessageHandlerInstance(queue);
    if (handlerInstance) {
      this.shutdownMessageHandler(handlerInstance, cb);
    } else {
      cb();
    }
  }

  /**
   * Adds a message handler for a queue. If already exists, returns an error.
   * If runner is running, starts the handler immediately.
   */
  addMessageHandler(
    queue: IQueueParsedParams,
    messageHandler: TConsumerMessageHandler,
    cb: ICallback<void>,
  ): void {
    if (this.getMessageHandler(queue)) {
      this.logger.warn(
        `Message handler for queue ${queue.queueParams.name} already exists`,
      );
      return cb(new MessageHandlerAlreadyExistsError());
    }
    const handlerParams: IConsumerMessageHandlerParams = {
      queue,
      messageHandler,
    };
    this.messageHandlers.push(handlerParams);
    this.logger.info(
      `Message handler registered for queue: ${queue.queueParams.name}. Total handlers: ${this.messageHandlers.length}`,
    );
    if (this.isRunning()) {
      this.runMessageHandler(handlerParams, cb);
    } else {
      cb();
    }
  }

  /**
   * Returns all queues for which message handlers are registered.
   */
  getQueues(): IQueueParsedParams[] {
    return this.messageHandlers.map((i) => i.queue);
  }

  protected override getLogger(): ILogger {
    return this.logger;
  }

  /**
   * Finds a running message handler instance for the given queue.
   */
  protected getMessageHandlerInstance(
    queue: IQueueParsedParams,
  ): MessageHandler | undefined {
    return this.messageHandlerInstances.find((i) =>
      this.isSameQueue(i.getQueue(), queue),
    );
  }

  /**
   * Finds the handler configuration for the given queue.
   */
  protected getMessageHandler(
    queue: IQueueParsedParams,
  ): IConsumerMessageHandlerParams | undefined {
    return this.messageHandlers.find((i) => this.isSameQueue(i.queue, queue));
  }

  /**
   * Creates and registers a new MessageHandler instance for the given parameters.
   */
  protected createMessageHandlerInstance(
    handlerParams: IConsumerMessageHandlerParams,
  ): MessageHandler {
    const instance = new MessageHandler(
      this.consumerContext,
      handlerParams,
      true,
    );
    instance.on('consumer.messageHandler.error', (err) => {
      this.logger.error(
        `MessageHandler [${instance.getId()}] has experienced a runtime error: ${err.message}. Shutting down instance. The supervisor will attempt to restart it.`,
      );
      this.shutdownMessageHandler(instance, () => {});
    });
    this.messageHandlerInstances.push(instance);
    return instance;
  }

  /**
   * Starts a message handler for the given parameters.
   */
  protected runMessageHandler(
    handlerParams: IConsumerMessageHandlerParams,
    cb: ICallback,
  ): void {
    // Avoid creating a duplicate instance if one already exists
    if (this.getMessageHandlerInstance(handlerParams.queue)) {
      this.logger.warn(
        `A message handler instance for queue ${handlerParams.queue.queueParams.name} is already running.`,
      );
      return cb();
    }
    const handler = this.createMessageHandlerInstance(handlerParams);
    handler.run((err) => {
      if (err) {
        this.logger.error(
          `Failed to run message handler for queue ${handlerParams.queue.queueParams.name}. Removing configuration.`,
          err,
        );
        this.removeMessageHandler(handlerParams.queue, () => cb(err));
      } else {
        cb();
      }
    });
  }

  /**
   * Shuts down a message handler and removes it from the instance list.
   */
  protected shutdownMessageHandler(
    messageHandler: MessageHandler,
    cb: ICallback,
  ): void {
    messageHandler.shutdown(() => {
      this.messageHandlerInstances = this.messageHandlerInstances.filter(
        (handler) => handler.getId() !== messageHandler.getId(),
      );
      cb();
    });
  }

  /**
   * Starts all registered message handlers.
   */
  protected runMessageHandlers = (cb: ICallback): void => {
    async.each(
      this.messageHandlers,
      (handlerParams, _, done) => {
        this.runMessageHandler(handlerParams, done);
      },
      cb,
    );
  };

  /**
   * Shuts down all running message handlers.
   */
  protected shutDownMessageHandlers = (cb: ICallback): void => {
    async.each(
      this.messageHandlerInstances,
      (handler, _, done) => {
        this.shutdownMessageHandler(handler, done);
      },
      () => {
        this.messageHandlerInstances = [];
        cb();
      },
    );
  };

  protected override goingUp(): ((cb: ICallback) => void)[] {
    return super.goingUp().concat([
      this.runMessageHandlers,
      (cb: ICallback) => {
        this.reconcileHandlers();
        cb();
      },
    ]);
  }

  protected override goingDown(): ((cb: ICallback) => void)[] {
    return [
      (cb: ICallback) => {
        this.supervisorTimer.reset();
        cb();
      },
      this.shutDownMessageHandlers,
    ].concat(super.goingDown());
  }

  protected override handleError(err: Error) {
    if (this.isRunning()) {
      this.logger.error(`MessageHandlerRunner error: ${err.message}`, err);
      this.emit(
        'consumer.messageHandlerRunner.error',
        err,
        this.consumerContext.consumerId,
      );
    }
    super.handleError(err);
  }
}
