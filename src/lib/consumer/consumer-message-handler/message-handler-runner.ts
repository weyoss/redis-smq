import { Consumer } from '../consumer';
import { MessageHandler } from './message-handler';
import { events } from '../../../common/events/events';
import {
  IRequiredConfig,
  TConsumerMessageHandler,
  TConsumerMessageHandlerParams,
  TQueueParams,
} from '../../../../types';
import { async, errors, RedisClient } from 'redis-smq-common';
import { MessageHandlerAlreadyExistsError } from '../errors/message-handler-already-exists.error';
import { ICallback, ICompatibleLogger } from 'redis-smq-common/dist/types';

export class MessageHandlerRunner {
  protected consumer: Consumer;
  protected sharedRedisClient: RedisClient | null = null;
  protected messageHandlerInstances: MessageHandler[] = [];
  protected messageHandlers: TConsumerMessageHandlerParams[] = [];
  protected config: IRequiredConfig;
  protected logger: ICompatibleLogger;

  constructor(consumer: Consumer, logger: ICompatibleLogger) {
    this.consumer = consumer;
    this.config = consumer.getConfig();
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
    queue: TQueueParams,
  ): MessageHandler | undefined {
    return this.messageHandlerInstances.find((i) => {
      const q = i.getQueue();
      return q.name === queue.name && q.ns === queue.ns;
    });
  }

  protected getMessageHandler(
    queue: TQueueParams,
  ): TConsumerMessageHandlerParams | undefined {
    return this.messageHandlers.find(
      (i) => i.queue.name === queue.name && i.queue.ns === queue.ns,
    );
  }

  protected createMessageHandlerInstance(
    dequeueRedisClient: RedisClient,
    handlerParams: TConsumerMessageHandlerParams,
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
    handlerParams: TConsumerMessageHandlerParams,
    cb: ICallback<void>,
  ): void {
    const { redis } = this.config;
    RedisClient.getNewInstance(redis, (err, client) => {
      if (err) cb(err);
      else if (!client) cb(new errors.EmptyCallbackReplyError());
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
    cb: ICallback<void>,
  ): void {
    const queue = messageHandler.getQueue();
    // ignoring errors
    messageHandler.shutdown(() => {
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
      throw new errors.PanicError('Expected a non-empty value');
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
        this.shutdownMessageHandler(handler, done);
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

  removeMessageHandler(queue: TQueueParams, cb: ICallback<void>): void {
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
      if (handlerInstance) this.shutdownMessageHandler(handlerInstance, cb);
      else cb();
    }
  }

  addMessageHandler(
    queue: TQueueParams,
    messageHandler: TConsumerMessageHandler,
    cb: ICallback<void>,
  ): void {
    const handler = this.getMessageHandler(queue);
    if (handler) cb(new MessageHandlerAlreadyExistsError(queue));
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

  getQueues(): TQueueParams[] {
    return this.messageHandlers.map((i) => i.queue);
  }
}
