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
import { events } from '../../../common/events/events';
import {
  EConsumeMessageUnacknowledgedCause,
  TConsumerMessageHandler,
  IConsumerMessageHandlerArgs,
  IQueueParams,
} from '../../../../types';
import {
  async,
  redis,
  RedisClient,
  ICallback,
  ILogger,
  CallbackEmptyReplyError,
  PanicError,
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
    messageHandler.on(events.ERROR, (...args: unknown[]) =>
      this.consumer.emit(events.ERROR, ...args),
    );
    messageHandler.on(events.MESSAGE_UNACKNOWLEDGED, (...args: unknown[]) =>
      this.consumer.emit(events.MESSAGE_UNACKNOWLEDGED, ...args),
    );
    messageHandler.on(events.MESSAGE_DEAD_LETTERED, (...args: unknown[]) =>
      this.consumer.emit(events.MESSAGE_DEAD_LETTERED, ...args),
    );
    messageHandler.on(events.MESSAGE_ACKNOWLEDGED, (...args: unknown[]) =>
      this.consumer.emit(events.MESSAGE_ACKNOWLEDGED, ...args),
    );
    messageHandler.on(events.MESSAGE_RECEIVED, (...args: unknown[]) =>
      this.consumer.emit(events.MESSAGE_RECEIVED, ...args),
    );
  }

  protected getMessageHandlerInstance(
    queue: IQueueParams,
  ): MessageHandler | undefined {
    return this.messageHandlerInstances.find((i) => {
      const q = i.getQueue();
      return q.name === queue.name && q.ns === queue.ns;
    });
  }

  protected getMessageHandler(
    queue: IQueueParams,
  ): IConsumerMessageHandlerArgs | undefined {
    return this.messageHandlers.find(
      (i) => i.queue.name === queue.name && i.queue.ns === queue.ns,
    );
  }

  protected createMessageHandlerInstance(
    dequeueRedisClient: RedisClient,
    handlerParams: IConsumerMessageHandlerArgs,
  ): MessageHandler {
    const sharedRedisClient = this.getSharedRedisClient();
    const { queue, messageHandler } = handlerParams;
    const instance = new MessageHandler(
      this.consumer,
      queue,
      messageHandler,
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
        handler.run(cb);
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
          const q = handler.getQueue();
          return !(q.name === queue.name && q.ns === queue.ns);
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

  removeMessageHandler(queue: IQueueParams, cb: ICallback<void>): void {
    const handler = this.getMessageHandler(queue);
    if (!handler) cb();
    else {
      this.messageHandlers = this.messageHandlers.filter((handler) => {
        const q = handler.queue;
        return !(q.name === queue.name && q.ns === queue.ns);
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
    queue: IQueueParams,
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
      if (this.consumer.isRunning()) this.runMessageHandler(handlerParams, cb);
      else cb();
    }
  }

  getQueues(): IQueueParams[] {
    return this.messageHandlers.map((i) => i.queue);
  }
}
