/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { Consumer } from '../consumer';
import { MessageHandler } from './message-handler';
import {
  EConsumeMessageUnacknowledgedCause,
  IConsumerMessageHandlerArgs,
  IQueueParsedParams,
  TConsumerMessageHandler,
} from '../../../../types';
import {
  async,
  CallbackEmptyReplyError,
  ICallback,
  ILogger,
  PanicError,
  redis,
  RedisClient,
} from 'redis-smq-common';
import { ConsumerMessageHandlerAlreadyExistsError } from '../errors';
import { Configuration } from '../../../config/configuration';

export class MessageHandlerRunner {
  protected consumer: Consumer;
  protected sharedRedisClient: RedisClient | null = null;
  protected messageHandlerInstances: MessageHandler[] = [];
  protected messageHandlers: IConsumerMessageHandlerArgs[] = [];
  protected logger: ILogger;

  constructor(consumer: Consumer, logger: ILogger) {
    this.consumer = consumer;
    this.logger = logger;
  }

  protected registerMessageHandlerEvents(messageHandler: MessageHandler): void {
    messageHandler.on('error', (...args) =>
      this.consumer.emit('error', ...args),
    );
    messageHandler.on('messageUnacknowledged', (...args) =>
      this.consumer.emit('messageUnacknowledged', ...args),
    );
    messageHandler.on('messageDeadLettered', (...args) =>
      this.consumer.emit('messageDeadLettered', ...args),
    );
    messageHandler.on('messageAcknowledged', (...args) =>
      this.consumer.emit('messageAcknowledged', ...args),
    );
    messageHandler.on('messageReceived', (...args) =>
      this.consumer.emit('messageReceived', ...args),
    );
  }

  protected getMessageHandlerInstance(
    queue: IQueueParsedParams,
  ): MessageHandler | undefined {
    const { queueParams, groupId } = queue;
    return this.messageHandlerInstances.find((i) => {
      const handlerQueue = i.getQueue();
      return (
        handlerQueue.queueParams.name === queueParams.name &&
        handlerQueue.queueParams.ns === queueParams.ns &&
        handlerQueue.groupId === groupId
      );
    });
  }

  protected getMessageHandler(
    queue: IQueueParsedParams,
  ): IConsumerMessageHandlerArgs | undefined {
    const { queueParams, groupId } = queue;
    return this.messageHandlers.find(
      (i) =>
        i.queue.queueParams.name === queueParams.name &&
        i.queue.queueParams.ns === queueParams.ns &&
        i.queue.groupId === groupId,
    );
  }

  protected createMessageHandlerInstance(
    dequeueRedisClient: RedisClient,
    handlerParams: IConsumerMessageHandlerArgs,
  ): MessageHandler {
    const sharedRedisClient = this.getSharedRedisClient();
    const instance = new MessageHandler(
      this.consumer,
      handlerParams,
      dequeueRedisClient,
      sharedRedisClient,
      this.logger,
    );
    this.registerMessageHandlerEvents(instance);
    this.messageHandlerInstances.push(instance);
    this.logger.info(
      `Created a new instance (ID: ${instance.getId()}) for MessageHandler (${JSON.stringify(
        handlerParams,
      )}).`,
    );
    return instance;
  }

  protected runMessageHandler(
    handlerParams: IConsumerMessageHandlerArgs,
    cb: ICallback<void>,
  ): void {
    const { redis: cfg } = Configuration.getSetConfig();
    redis.createInstance(cfg, (err, client) => {
      if (err) cb(err);
      else if (!client) cb(new CallbackEmptyReplyError());
      else {
        const handler = this.createMessageHandlerInstance(
          client,
          handlerParams,
        );
        handler.run((err) => {
          if (err)
            this.removeMessageHandler(handlerParams.queue, () => cb(err));
          else cb();
        });
      }
    });
  }

  protected shutdownMessageHandler(
    messageHandler: MessageHandler,
    messageUnacknowledgedCause: EConsumeMessageUnacknowledgedCause,
    cb: ICallback<void>,
  ): void {
    const queue = messageHandler.getQueue();
    // ignoring errors
    messageHandler.shutdown(messageUnacknowledgedCause, () => {
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
      cb();
    });
  }

  protected getSharedRedisClient(): RedisClient {
    if (!this.sharedRedisClient) {
      throw new PanicError('Expected a non-empty value');
    }
    return this.sharedRedisClient;
  }

  run(redisClient: RedisClient, cb: ICallback<void>): void {
    this.sharedRedisClient = redisClient;
    async.each(
      this.messageHandlers,
      (handlerParams, _, done) => {
        this.runMessageHandler(handlerParams, done);
      },
      cb,
    );
  }

  shutdown(cb: ICallback<void>): void {
    async.each(
      this.messageHandlerInstances,
      (handler, queue, done) => {
        this.shutdownMessageHandler(
          handler,
          EConsumeMessageUnacknowledgedCause.OFFLINE_CONSUMER,
          done,
        );
      },
      (err) => {
        if (err) cb(err);
        else {
          this.sharedRedisClient = null;
          cb();
        }
      },
    );
  }

  removeMessageHandler(queue: IQueueParsedParams, cb: ICallback<void>): void {
    const { queueParams, groupId } = queue;
    const handler = this.getMessageHandler(queue);
    if (!handler) cb();
    else {
      this.messageHandlers = this.messageHandlers.filter((handler) => {
        const handerQueue = handler.queue;
        return !(
          queueParams.name === handerQueue.queueParams.name &&
          queueParams.ns === handerQueue.queueParams.ns &&
          groupId === handerQueue.groupId
        );
      });
      this.logger.info(
        `Message handler with parameters (${JSON.stringify(
          queue,
        )}) has been removed.`,
      );
      const handlerInstance = this.getMessageHandlerInstance(queue);
      if (handlerInstance)
        this.shutdownMessageHandler(
          handlerInstance,
          EConsumeMessageUnacknowledgedCause.OFFLINE_MESSAGE_HANDLER,
          cb,
        );
      else cb();
    }
  }

  addMessageHandler(
    queue: IQueueParsedParams,
    messageHandler: TConsumerMessageHandler,
    cb: ICallback<void>,
  ): void {
    const handler = this.getMessageHandler(queue);
    if (handler) cb(new ConsumerMessageHandlerAlreadyExistsError(queue));
    else {
      const handlerParams = {
        queue,
        messageHandler,
      };
      this.messageHandlers.push(handlerParams);
      this.logger.info(
        `Message handler with parameters (${JSON.stringify(
          handlerParams,
        )}) has been registered.`,
      );
      if (this.consumer.isRunning()) {
        this.runMessageHandler(handlerParams, cb);
      } else cb();
    }
  }

  getQueues(): IQueueParsedParams[] {
    return this.messageHandlers.map((i) => i.queue);
  }
}
