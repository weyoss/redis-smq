import { MessageHandler } from '../message-handler';
import { MessageHandlerRunner } from '../message-handler-runner';
import {
  async,
  createClientInstance,
  errors,
  RedisClient,
  Ticker,
} from 'redis-smq-common';
import { TConsumerMessageHandlerParams } from '../../../../../types';
import { Consumer } from '../../consumer';
import { events } from '../../../../common/events/events';
import { MultiplexedMessageHandler } from './multiplexed-message-handler';
import { ICallback, ICompatibleLogger } from 'redis-smq-common/dist/types';

export class MultiplexedMessageHandlerRunner extends MessageHandlerRunner {
  protected muxRedisClient: RedisClient | null = null;
  protected ticker: Ticker;
  protected index = 0;
  protected activeMessageHandler: MessageHandler | null | undefined = null;
  protected multiplexingDelay = true;

  constructor(consumer: Consumer, logger: ICompatibleLogger) {
    super(consumer, logger);
    this.ticker = new Ticker(() => this.dequeue());
  }

  protected nextTick(): void {
    if (!this.ticker.isTicking()) {
      this.activeMessageHandler = null;
      this.ticker.nextTick();
    }
  }

  protected override registerMessageHandlerEvents(
    messageHandler: MessageHandler,
  ): void {
    super.registerMessageHandlerEvents(messageHandler);
    messageHandler.on(events.MESSAGE_NEXT, () => {
      if (this.multiplexingDelay) this.nextTick();
      else this.dequeue();
    });
    messageHandler.on(
      events.MESSAGE_RECEIVED,
      () => (this.multiplexingDelay = false),
    );
  }

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

  protected dequeue(): void {
    this.activeMessageHandler = this.getNextMessageHandler();
    if (this.activeMessageHandler) {
      this.multiplexingDelay = true;
      this.activeMessageHandler.dequeue();
    } else {
      this.nextTick();
    }
  }

  protected override createMessageHandlerInstance(
    redisClient: RedisClient,
    handlerParams: TConsumerMessageHandlerParams,
  ): MessageHandler {
    const sharedRedisClient = this.getSharedRedisClient();
    const { queue, messageHandler } = handlerParams;
    const instance = new MultiplexedMessageHandler(
      this.consumer,
      queue,
      messageHandler,
      redisClient,
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

  protected override runMessageHandler(
    handlerParams: TConsumerMessageHandlerParams,
    cb: ICallback<void>,
  ): void {
    const client = this.getMuxRedisClient();
    const handler = this.createMessageHandlerInstance(client, handlerParams);
    handler.run(cb);
  }

  protected getMuxRedisClient(): RedisClient {
    if (!this.muxRedisClient) {
      throw new errors.PanicError('Expected a non-empty value');
    }
    return this.muxRedisClient;
  }

  protected override shutdownMessageHandler(
    messageHandler: MessageHandler,
    cb: ICallback<void>,
  ): void {
    super.shutdownMessageHandler(messageHandler, () => {
      if (messageHandler === this.activeMessageHandler) {
        this.nextTick();
      }
      cb();
    });
  }

  override run(redisClient: RedisClient, cb: ICallback<void>): void {
    async.waterfall(
      [
        (cb: ICallback<void>) => {
          const { redis } = this.config;
          createClientInstance(redis, (err, client) => {
            if (err) cb(err);
            else if (!client) cb(new errors.EmptyCallbackReplyError());
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
  }

  override shutdown(cb: ICallback<void>): void {
    async.waterfall(
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
  }
}
