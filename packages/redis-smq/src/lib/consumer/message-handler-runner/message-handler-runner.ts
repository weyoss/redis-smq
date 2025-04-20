/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { async, ICallback, ILogger, logger, Runnable } from 'redis-smq-common';
import { TConsumerMessageHandlerRunnerEvent } from '../../../common/index.js';
import { RedisClient } from '../../../common/redis-client/redis-client.js';
import { Configuration } from '../../../config/index.js';
import { EventBus } from '../../event-bus/index.js';
import { IQueueParsedParams } from '../../queue/index.js';
import { Consumer } from '../consumer/consumer.js';
import { ConsumerConsumeMessageHandlerAlreadyExistsError } from '../errors/index.js';
import { MessageHandler } from '../message-handler/message-handler/message-handler.js';
import {
  IConsumerMessageHandlerArgs,
  TConsumerMessageHandler,
} from '../types/index.js';
import { eventBusPublisher } from './event-bus-publisher.js';

/**
 * Manages the lifecycle of message handlers for a consumer, including
 * adding, removing, starting, and shutting down handlers for specific queues.
 */
export class MessageHandlerRunner extends Runnable<TConsumerMessageHandlerRunnerEvent> {
  protected consumer: Consumer;
  protected redisClient: RedisClient;
  protected logger: ILogger;
  protected messageHandlerInstances: MessageHandler[] = [];
  protected messageHandlers: IConsumerMessageHandlerArgs[] = [];
  protected eventBus: EventBus | null;

  constructor(
    consumer: Consumer,
    redisClient: RedisClient,
    eventBus: EventBus | null,
  ) {
    super();
    this.consumer = consumer;
    this.redisClient = redisClient;
    this.logger = logger.getLogger(
      Configuration.getSetConfig().logger,
      this.constructor.name.toLowerCase(),
    );
    this.logger.info(`Initializing MessageHandlerRunner with ID: ${this.id}`);
    this.eventBus = eventBus;
    if (this.eventBus) {
      this.logger.debug('Event bus provided, setting up event bus publisher');
      eventBusPublisher(this, this.eventBus, this.logger);
    }
    this.logger.debug(
      `MessageHandlerRunner initialized for consumer ID: ${this.consumer.getId()}`,
    );
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
    return this.messageHandlerInstances.find((i) => {
      const handlerQueue = i.getQueue();
      return (
        handlerQueue.queueParams.name === queue.queueParams.name &&
        handlerQueue.queueParams.ns === queue.queueParams.ns &&
        handlerQueue.groupId === queue.groupId
      );
    });
  }

  /**
   * Finds the handler configuration for the given queue.
   */
  protected getMessageHandler(
    queue: IQueueParsedParams,
  ): IConsumerMessageHandlerArgs | undefined {
    return this.messageHandlers.find(
      (i) =>
        i.queue.queueParams.name === queue.queueParams.name &&
        i.queue.queueParams.ns === queue.queueParams.ns &&
        i.queue.groupId === queue.groupId,
    );
  }

  /**
   * Creates and registers a new MessageHandler instance for the given parameters.
   */
  protected createMessageHandlerInstance(
    handlerParams: IConsumerMessageHandlerArgs,
  ): MessageHandler {
    const instance = new MessageHandler(
      this.consumer,
      this.redisClient,
      handlerParams,
      true,
      this.eventBus,
    );
    instance.on('consumer.messageHandler.error', (err, consumerId, queue) => {
      this.logger.error(
        `MessageHandler error from consumer ${consumerId} for queue ${JSON.stringify(queue)}: ${err.message}`,
      );
      this.removeMessageHandler(queue, () => {
        this.logger.error(`Error in MessageHandler: ${err.message}`, err);
      });
    });
    this.messageHandlerInstances.push(instance);
    this.logger.info(
      `Created MessageHandler (ID: ${instance.getId()}) for queue: ${handlerParams.queue.queueParams.name}. Total: ${this.messageHandlerInstances.length}`,
    );
    return instance;
  }

  /**
   * Starts a message handler for the given parameters.
   */
  protected runMessageHandler(
    handlerParams: IConsumerMessageHandlerArgs,
    cb: ICallback<void>,
  ): void {
    const handler = this.createMessageHandlerInstance(handlerParams);
    handler.run((err) => {
      if (err) {
        this.logger.error(`Failed to run message handler: ${err.message}`);
        this.removeMessageHandler(handlerParams.queue, () => cb(err));
      } else {
        this.logger.debug(
          `Message handler started for queue: ${handlerParams.queue.queueParams.name}`,
        );
        cb();
      }
    });
  }

  /**
   * Shuts down a message handler and removes it from the instance list.
   */
  protected shutdownMessageHandler(
    messageHandler: MessageHandler,
    cb: ICallback<void>,
  ): void {
    const queue = messageHandler.getQueue();
    messageHandler.shutdown((err) => {
      if (err) {
        this.logger.warn(
          `Error during message handler shutdown (ignored): ${err.message}`,
        );
      }
      const beforeCount = this.messageHandlerInstances.length;
      this.messageHandlerInstances = this.messageHandlerInstances.filter(
        (handler) => {
          const iQueue = handler.getQueue();
          return !(
            iQueue.queueParams.name === queue.queueParams.name &&
            iQueue.queueParams.ns === queue.queueParams.ns &&
            iQueue.groupId === queue.groupId
          );
        },
      );
      const afterCount = this.messageHandlerInstances.length;
      this.logger.debug(
        `Removed ${beforeCount - afterCount} message handler instance(s). Remaining: ${afterCount}`,
      );
      cb();
    });
  }

  /**
   * Starts all registered message handlers.
   */
  protected runMessageHandlers = (cb: ICallback<void>): void => {
    const handlerCount = this.messageHandlers.length;
    this.logger.info(`Starting ${handlerCount} message handler(s)`);
    if (handlerCount === 0) return cb();
    async.each(
      this.messageHandlers,
      (handlerParams, _, done) => {
        this.runMessageHandler(handlerParams, done);
      },
      (err) => {
        if (err) {
          this.logger.error(`Error starting message handlers: ${err.message}`);
        } else {
          this.logger.info(`All message handlers started`);
        }
        cb(err);
      },
    );
  };

  /**
   * Shuts down all running message handlers.
   */
  protected shutDownMessageHandlers = (cb: ICallback<void>): void => {
    const handlerCount = this.messageHandlerInstances.length;
    this.logger.info(`Shutting down ${handlerCount} message handler(s)`);
    if (handlerCount === 0) return cb();
    async.each(
      this.messageHandlerInstances,
      (handler, _, done) => {
        this.shutdownMessageHandler(handler, done);
      },
      () => {
        this.messageHandlerInstances = [];
        this.logger.info('All message handlers have been shut down');
        cb();
      },
    );
  };

  protected override goingUp(): ((cb: ICallback<void>) => void)[] {
    this.logger.info('MessageHandlerRunner going up');
    return super.goingUp().concat([this.runMessageHandlers]);
  }

  protected override goingDown(): ((cb: ICallback<void>) => void)[] {
    this.logger.info('MessageHandlerRunner going down');
    return [this.shutDownMessageHandlers].concat(super.goingDown());
  }

  protected override handleError(err: Error) {
    if (this.isRunning()) {
      this.logger.error(`MessageHandlerRunner error: ${err.message}`, err);
      this.emit(
        'consumer.messageHandlerRunner.error',
        err,
        this.consumer.getId(),
      );
    }
    super.handleError(err);
  }

  /**
   * Removes a message handler for a given queue, shutting down any running instance.
   */
  removeMessageHandler(queue: IQueueParsedParams, cb: ICallback<void>): void {
    const handler = this.getMessageHandler(queue);
    if (!handler) {
      this.logger.debug(
        `No message handler found for queue: ${queue.queueParams.name}, nothing to remove`,
      );
      return cb();
    }
    // Remove from configuration
    const beforeCount = this.messageHandlers.length;
    this.messageHandlers = this.messageHandlers.filter((h) => {
      const q = h.queue;
      return !(
        queue.queueParams.name === q.queueParams.name &&
        queue.queueParams.ns === q.queueParams.ns &&
        queue.groupId === q.groupId
      );
    });
    const afterCount = this.messageHandlers.length;
    this.logger.info(
      `Message handler for queue (${queue.queueParams.name}) removed. Removed ${beforeCount - afterCount} configuration(s).`,
    );
    // Remove running instance if exists
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
      return cb(new ConsumerConsumeMessageHandlerAlreadyExistsError());
    }
    const handlerParams: IConsumerMessageHandlerArgs = {
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
}
