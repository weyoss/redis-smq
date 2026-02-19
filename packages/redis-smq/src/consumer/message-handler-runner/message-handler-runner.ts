/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
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
import { eventPublisher } from './event-publisher.js';
import {
  IConsumerMessageHandlerParams,
  TConsumerMessageHandler,
} from '../message-handler/types/index.js';
import { IConsumerContext } from '../types/consumer-context.js';
import { QueueStateChangeHandler } from './queue-state-change-handler.js';
import { _validateOperation } from '../../queue-operation-validator/_/_validate-operation.js';
import { withSharedPoolConnection } from '../../common/redis/redis-connection-pool/with-shared-pool-connection.js';
import { EQueueOperation } from '../../queue-operation-validator/index.js';

/**
 * Manages the lifecycle of message handlers for a consumer, including
 * adding, removing, starting, and shutting down handlers for specific queues.
 * It also includes a supervisor mechanism to automatically restart handlers
 * that fail during runtime.
 */
export class MessageHandlerRunner extends Runnable<TConsumerMessageHandlerRunnerEvent> {
  protected readonly handlerReconciliationInterval = 5000; // todo: make it configurable: config.consumer.handlerReconciliationInterval
  protected readonly consumerContext: IConsumerContext;
  protected readonly supervisorTimer: Timer;
  protected readonly queueStateChangeHandler: QueueStateChangeHandler;

  protected logger: ILogger;
  protected messageHandlerInstances: MessageHandler[] = [];
  protected messageHandlers: IConsumerMessageHandlerParams[] = [];

  constructor(consumerContext: IConsumerContext) {
    super();
    this.consumerContext = consumerContext;
    this.logger = this.consumerContext.logger.createLogger(
      this.constructor.name,
    );
    this.queueStateChangeHandler = new QueueStateChangeHandler(
      this,
      this.logger,
    );
    eventPublisher(this);
    this.supervisorTimer = new Timer();
    this.supervisorTimer.on('error', (err) => this.handleError(err));
    this.logger.info(`MessageHandlerRunner with ID: ${this.id} initialized.`);
  }

  /**
   * Generates a unique, consistent identifier for a queue configuration.
   */
  protected getQueueIdentifier(queue: IQueueParsedParams): string {
    return `${queue.queueParams.ns}:${queue.queueParams.name}:${queue.groupId ?? ''}`;
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
   * Checks if a queue is active (not stopped, paused, or locked).
   */
  protected isQueueActive(queue: IQueueParsedParams): boolean {
    return this.queueStateChangeHandler.isQueueActive(queue.queueParams);
  }

  /**
   * Checks if a queue is stopped.
   */
  protected isQueueStopped(queue: IQueueParsedParams): boolean {
    return this.queueStateChangeHandler.isQueueStopped(queue.queueParams);
  }

  /**
   * Checks if a queue is paused.
   */
  protected isQueuePaused(queue: IQueueParsedParams): boolean {
    return this.queueStateChangeHandler.isQueuePaused(queue.queueParams);
  }

  /**
   * Checks if a queue is locked.
   */
  protected isQueueLocked(queue: IQueueParsedParams): boolean {
    return this.queueStateChangeHandler.isQueueLocked(queue.queueParams);
  }

  /**
   * Schedules the next reconciliation check.
   */
  protected scheduleReconciliation = (): void => {
    if (this.isOperational()) {
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
    if (!this.isOperational()) return;

    this.logger.debug('Running handler reconciliation...');
    const runningQueues = new Set(
      this.messageHandlerInstances.map((i) =>
        this.getQueueIdentifier(i.getQueue()),
      ),
    );

    const zombieHandlers = this.messageHandlers.filter(
      (i) =>
        !runningQueues.has(this.getQueueIdentifier(i.queue)) &&
        this.isQueueActive(i.queue),
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

          // Double-check queue state before starting
          if (!this.isQueueActive(handlerParams.queue)) {
            this.logger.debug(
              `Queue ${handlerParams.queue.queueParams.name} is not active, skipping restart`,
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
  getMessageHandler(
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
      this.shutdownMessageHandler(instance, (err) => {
        if (err) {
          this.logger.error(
            `Failed to shutdown handler ${instance.getId()}: ${err.message}`,
          );
        }
      });
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
    // Check queue state before starting
    if (!this.isQueueActive(handlerParams.queue)) {
      this.logger.debug(
        `Queue ${handlerParams.queue.queueParams.name} is not active, skipping start`,
      );
      return cb();
    }

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
    // Filter to only active queues
    const handlersToStart = this.messageHandlers.filter((handler) =>
      this.isQueueActive(handler.queue),
    );

    async.each(
      handlersToStart,
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
      this.queueStateChangeHandler.shutdown,
      this.shutDownMessageHandlers,
    ].concat(super.goingDown());
  }

  protected override handleError(err: Error) {
    if (this.isOperational()) {
      this.logger.error(`MessageHandlerRunner error: ${err.message}`, err);
      this.emit(
        'consumer.messageHandlerRunner.error',
        err,
        this.consumerContext.consumerId,
      );
    }
    super.handleError(err);
  }

  /**
   * Stops a message handler (keeps configuration).
   * Used when queue state changes to STOPPED/PAUSED/LOCKED.
   */
  stopMessageHandler(queue: IQueueParsedParams, cb: ICallback<boolean>): void {
    const handlerInstance = this.getMessageHandlerInstance(queue);

    if (!handlerInstance) {
      // No instance running, but configuration exists
      const hasConfig = !!this.getMessageHandler(queue);
      this.logger.debug(
        `Stop requested for queue: ${queue.queueParams.name} (no instance)`,
      );
      return cb(null, hasConfig);
    }

    // Stop the running instance
    this.shutdownMessageHandler(handlerInstance, (err) => {
      if (err) {
        this.logger.error(
          `Failed to stop handler for queue ${queue.queueParams.name}:`,
          err,
        );
        cb(err);
      } else {
        this.logger.info(
          `Stopped message handler for queue: ${queue.queueParams.name} (configuration kept)`,
        );
        cb(null, true);
      }
    });
  }

  /**
   * Starts a message handler.
   * Used when queue state changes from STOPPED/PAUSED/LOCKED to ACTIVE.
   */
  startMessageHandler(queue: IQueueParsedParams, cb: ICallback<boolean>): void {
    // Check if configuration exists
    const handlerConfig = this.getMessageHandler(queue);
    if (!handlerConfig) {
      this.logger.warn(
        `No handler configuration found for queue: ${queue.queueParams.name}`,
      );
      return cb(null, false);
    }

    // Check if already running
    if (this.getMessageHandlerInstance(queue)) {
      this.logger.debug(
        `Handler already running for queue: ${queue.queueParams.name}`,
      );
      return cb(null, false);
    }

    // Check queue state before starting
    if (!this.isQueueActive(queue)) {
      this.logger.debug(
        `Queue ${queue.queueParams.name} is not active, cannot start handler`,
      );
      return cb(null, false);
    }

    // Start the handler
    this.runMessageHandler(handlerConfig, (err) => {
      if (err) {
        this.logger.error(
          `Failed to start handler for queue ${queue.queueParams.name}:`,
          err,
        );
        cb(err);
      } else {
        this.logger.info(
          `Started message handler for queue: ${queue.queueParams.name}`,
        );
        cb(null, true);
      }
    });
  }

  /**
   * Removes a message handler completely.
   */
  removeMessageHandler(queue: IQueueParsedParams, cb: ICallback): void {
    // Remove configuration
    const hadConfig = this.getMessageHandler(queue);
    this.messageHandlers = this.messageHandlers.filter(
      (h) => !this.isSameQueue(h.queue, queue),
    );
    const handlerInstance = this.getMessageHandlerInstance(queue);
    if (handlerInstance) {
      this.shutdownMessageHandler(handlerInstance, cb);
    } else {
      if (hadConfig) {
        this.logger.info(
          `Removed handler configuration for queue: ${queue.queueParams.name}`,
        );
      }
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

    async.series(
      [
        (cb) =>
          withSharedPoolConnection((client, cb) => {
            _validateOperation(
              client,
              queue.queueParams,
              EQueueOperation.CONSUME,
              cb,
            );
          }, cb),
        (cb) => {
          const handlerParams: IConsumerMessageHandlerParams = {
            queue,
            messageHandler,
          };
          this.messageHandlers.push(handlerParams);
          this.logger.info(
            `Message handler registered for queue: ${queue.queueParams.name}. Total handlers: ${this.messageHandlers.length}`,
          );

          // If runner is running and queue is active, start it immediately
          if (this.isOperational() && this.isQueueActive(queue)) {
            this.runMessageHandler(handlerParams, cb);
          } else {
            cb();
          }
        },
      ],
      (err) => cb(err),
    );
  }

  /**
   * Returns all queues with handler configurations.
   */
  getQueues(): IQueueParsedParams[] {
    return this.messageHandlers.map((i) => i.queue);
  }

  /**
   * Returns only active queues.
   */
  getActiveQueues(): IQueueParsedParams[] {
    return this.messageHandlers
      .filter((handler) => this.isQueueActive(handler.queue))
      .map((i) => i.queue);
  }

  /**
   * Returns only stopped queues.
   */
  getStoppedQueues(): IQueueParsedParams[] {
    return this.messageHandlers
      .filter((handler) => this.isQueueStopped(handler.queue))
      .map((i) => i.queue);
  }

  /**
   * Returns only paused queues.
   */
  getPausedQueues(): IQueueParsedParams[] {
    return this.messageHandlers
      .filter((handler) => this.isQueuePaused(handler.queue))
      .map((i) => i.queue);
  }

  /**
   * Returns only locked queues.
   */
  getLockedQueues(): IQueueParsedParams[] {
    return this.messageHandlers
      .filter((handler) => this.isQueueLocked(handler.queue))
      .map((i) => i.queue);
  }

  /**
   * Checks if a handler is stopped.
   */
  isMessageHandlerStopped(queue: IQueueParsedParams): boolean {
    return this.isQueueStopped(queue);
  }

  /**
   * Checks if a handler is running.
   */
  isMessageHandlerRunning(queue: IQueueParsedParams): boolean {
    const instance = this.getMessageHandlerInstance(queue);
    return !!instance && instance.isOperational();
  }

  /**
   * Gets the number of registered handlers.
   */
  getHandlerCount(): {
    total: number;
    active: number;
    stopped: number;
    paused: number;
    locked: number;
  } {
    const total = this.messageHandlers.length;
    const active = this.getActiveQueues().length;
    const stopped = this.getStoppedQueues().length;
    const paused = this.getPausedQueues().length;
    const locked = this.getLockedQueues().length;

    // Optional validation
    const accountedFor = active + stopped + paused + locked;
    if (accountedFor !== total) {
      this.logger.warn(
        `Queue state accounting mismatch: total=${total}, accounted=${accountedFor}`,
      );
    }

    return { total, active, stopped, paused, locked };
  }
}
