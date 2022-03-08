import { MessageHandler } from '../message-handler';
import { MessageHandlerRunner } from '../message-handler-runner';
import { Ticker } from '../../../../common/ticker/ticker';
import {
  ICallback,
  TConsumerMessageHandlerParams,
} from '../../../../../../types';
import { Consumer } from '../../consumer';
import { RedisClient } from '../../../../common/redis-client/redis-client';
import { EmptyCallbackReplyError } from '../../../../common/errors/empty-callback-reply.error';
import { waterfall } from '../../../../lib/async';
import { events } from '../../../../common/events';
import { MultiplexedMessageHandler } from './multiplexed-message-handler';

export class MultiplexedMessageHandlerRunner extends MessageHandlerRunner {
  protected muxRedisClient: RedisClient | null = null;
  protected ticker: Ticker;
  protected index = 0;
  protected activeMessageHandler: MessageHandler | null | undefined = null;

  constructor(consumer: Consumer) {
    super(consumer);
    this.ticker = new Ticker(this.dequeue);
  }

  protected override registerMessageHandlerEvents = (
    messageHandler: MessageHandler,
  ): void => {
    super.registerMessageHandlerEvents(messageHandler);
    messageHandler.on(events.MESSAGE_MULTIPLEXER_NEXT, () =>
      this.ticker.nextTick(),
    );
  };

  protected getNextMessageHandler(): MessageHandler | undefined {
    if (this.index >= this.messageHandlerInstances.length) {
      this.index = 0;
    }
    const messageHandler = this.messageHandlerInstances[this.index];
    if (this.messageHandlerInstances.length > 1) {
      this.index += 1;
    }
    return messageHandler;
  }

  protected dequeue = (): void => {
    this.activeMessageHandler = this.getNextMessageHandler();
    if (this.activeMessageHandler) {
      this.activeMessageHandler.dequeue();
    }
  };

  protected override createMessageHandlerInstance = (
    redisClient: RedisClient,
    handlerParams: TConsumerMessageHandlerParams,
  ): MessageHandler => {
    const sharedRedisClient = this.getSharedRedisClient();
    const { queue, usePriorityQueuing, messageHandler } = handlerParams;
    const messageRate = this.config.monitor.enabled
      ? this.createMessageRateInstance(queue, sharedRedisClient)
      : null;
    const instance = new MultiplexedMessageHandler(
      this.consumer.getId(),
      queue,
      messageHandler,
      usePriorityQueuing,
      redisClient,
      messageRate,
    );
    this.registerMessageHandlerEvents(instance);
    this.messageHandlerInstances.push(instance);
    this.logger.info(
      `Created a new instance (ID: ${instance.getId()}) for MessageHandler (${JSON.stringify(
        handlerParams,
      )}).`,
    );
    return instance;
  };

  protected override shutdownMessageHandler = (
    messageHandler: MessageHandler,
    cb: ICallback<void>,
  ): void => {
    super.shutdownMessageHandler(messageHandler, () => {
      if (messageHandler === this.activeMessageHandler) {
        this.dequeue();
      }
      cb();
    });
  };

  override run = (redisClient: RedisClient, cb: ICallback<void>): void => {
    waterfall(
      [
        (cb: ICallback<void>) => {
          RedisClient.getNewInstance((err, client) => {
            if (err) cb(err);
            else if (!client) cb(new EmptyCallbackReplyError());
            else {
              this.muxRedisClient = client;
              cb();
            }
          });
        },
        (cb: ICallback<void>) => {
          super.run(redisClient, cb);
        },
      ],
      (err) => {
        if (err) cb(err);
        else {
          this.dequeue();
          cb();
        }
      },
    );
  };

  override shutdown = (cb: ICallback<void>): void => {
    waterfall(
      [
        (cb: ICallback<void>) => {
          this.ticker.once(events.DOWN, cb);
          this.ticker.quit();
        },
        (cb: ICallback<void>) => super.shutdown(cb),
        (cb: ICallback<void>) => {
          if (this.muxRedisClient) this.muxRedisClient.halt(cb);
          else cb();
        },
      ],
      cb,
    );
  };
}
