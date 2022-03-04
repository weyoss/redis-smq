import { Consumer } from '../consumer';
import { MessageHandler } from './message-handler';
import { events } from '../../../common/events';
import {
  ICallback,
  ICompatibleLogger,
  IRequiredConfig,
  TConsumerMessageHandler,
  TConsumerMessageHandlerParams,
  TQueueParams,
} from '../../../../../types';
import { RedisClient } from '../../../common/redis-client/redis-client';
import { EmptyCallbackReplyError } from '../../../common/errors/empty-callback-reply.error';
import { each } from '../../../lib/async';
import { getConfiguration } from '../../../common/configuration/configuration';
import { getNamespacedLogger } from '../../../common/logger';
import { ConsumerMessageRate } from '../consumer-message-rate';
import { ConsumerMessageRateWriter } from '../consumer-message-rate-writer';
import { MessageHandlerAlreadyExistsError } from '../errors/message-handler-already-exists.error';
import { PanicError } from '../../../common/errors/panic.error';

export class MessageHandlerRunner {
  private readonly consumer: Consumer;
  private redisClient: RedisClient | null = null;
  private messageHandlerInstances: MessageHandler[] = [];
  private messageHandlers: TConsumerMessageHandlerParams[] = [];
  private config: IRequiredConfig;
  protected logger: ICompatibleLogger;

  constructor(consumer: Consumer) {
    this.consumer = consumer;
    this.config = getConfiguration();
    this.logger = getNamespacedLogger(
      `${consumer.constructor.name}/${consumer.getId()}/MessageHandlerRunner`,
    );
  }

  protected registerMessageHandlerEvents = (
    messageHandler: MessageHandler,
  ): void => {
    messageHandler.on(events.ERROR, (...args: unknown[]) =>
      this.consumer.emit(events.ERROR, ...args),
    );
    messageHandler.on(events.IDLE, (...args: unknown[]) =>
      this.consumer.emit(events.IDLE, ...args),
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
  };

  protected getMessageHandlerInstance = (
    queue: TQueueParams,
  ): MessageHandler | undefined => {
    return this.messageHandlerInstances.find((i) => {
      const q = i.getQueue();
      return q.name === queue.name && q.ns === queue.ns;
    });
  };

  protected getMessageHandler(
    queue: TQueueParams,
  ): TConsumerMessageHandlerParams | undefined {
    return this.messageHandlers.find(
      (i) => i.queue.name === queue.name && i.queue.ns === queue.ns,
    );
  }

  protected createMessageRateInstance = (
    queue: TQueueParams,
    redisClient: RedisClient,
  ): ConsumerMessageRate => {
    const messageRateWriter = new ConsumerMessageRateWriter(
      redisClient,
      queue,
      this.consumer.getId(),
    );
    return new ConsumerMessageRate(messageRateWriter);
  };

  protected runMessageHandler = (
    handlerParams: TConsumerMessageHandlerParams,
    cb: ICallback<void>,
  ): void => {
    RedisClient.getNewInstance((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new EmptyCallbackReplyError());
      else {
        const redisClient = this.getRedisClient();
        const { queue, usePriorityQueuing, messageHandler } = handlerParams;
        const messageRate = this.config.monitor.enabled
          ? this.createMessageRateInstance(queue, redisClient)
          : null;
        const handler = new MessageHandler(
          this.consumer.getId(),
          queue,
          messageHandler,
          usePriorityQueuing,
          client,
          messageRate,
        );
        this.registerMessageHandlerEvents(handler);
        this.messageHandlerInstances.push(handler);
        this.logger.info(
          `Created a new instance (ID: ${handler.getId()}) for MessageHandler (${JSON.stringify(
            handlerParams,
          )}).`,
        );
        handler.run(cb);
      }
    });
  };

  protected shutdownMessageHandler = (
    messageHandler: MessageHandler,
    cb: ICallback<void>,
  ): void => {
    const queue = messageHandler.getQueue();
    const redisClient = this.getRedisClient();
    // ignoring errors
    messageHandler.shutdown(redisClient, () => {
      this.messageHandlerInstances = this.messageHandlerInstances.filter(
        (handler) => {
          const q = handler.getQueue();
          return !(q.name === queue.name && q.ns === queue.ns);
        },
      );
      cb();
    });
  };

  protected getRedisClient(): RedisClient {
    if (!this.redisClient) {
      throw new PanicError('Expected a non-empty value');
    }
    return this.redisClient;
  }

  run = (redisClient: RedisClient, cb: ICallback<void>): void => {
    this.redisClient = redisClient;
    each(
      this.messageHandlers,
      (handlerParams, _, done) => {
        this.runMessageHandler(handlerParams, done);
      },
      cb,
    );
  };

  shutdown = (cb: ICallback<void>): void => {
    each(
      this.messageHandlerInstances,
      (handler, queue, done) => {
        this.shutdownMessageHandler(handler, done);
      },
      (err) => {
        if (err) cb(err);
        else {
          this.redisClient = null;
          cb();
        }
      },
    );
  };

  removeMessageHandler = (queue: TQueueParams, cb: ICallback<void>): void => {
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
  };

  addMessageHandler = (
    queue: TQueueParams,
    usePriorityQueuing: boolean,
    messageHandler: TConsumerMessageHandler,
    cb: ICallback<boolean>,
  ): void => {
    const handler = this.getMessageHandler(queue);
    if (handler) cb(new MessageHandlerAlreadyExistsError(queue));
    else {
      const handlerParams = {
        queue,
        usePriorityQueuing,
        messageHandler,
      };
      this.messageHandlers.push(handlerParams);
      this.logger.info(
        `Message handler with parameters (${JSON.stringify(
          handlerParams,
        )}) has been registered.`,
      );
      if (this.consumer.isRunning())
        this.runMessageHandler(handlerParams, (err) => {
          if (err) cb(err);
          else cb(null, true);
        });
      else cb(null, false);
    }
  };

  getQueues = (): { queue: TQueueParams; usingPriorityQueuing: boolean }[] => {
    return this.messageHandlers.map((i) => ({
      queue: i.queue,
      usingPriorityQueuing: i.usePriorityQueuing,
    }));
  };
}
