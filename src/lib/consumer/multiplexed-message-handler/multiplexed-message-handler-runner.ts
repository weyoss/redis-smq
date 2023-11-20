/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { MessageHandler } from '../message-handler/message-handler';
import { MessageHandlerRunner } from '../message-handler/message-handler-runner';
import {
  async,
  redis,
  RedisClient,
  Ticker,
  ICallback,
  ILogger,
  PanicError,
  CallbackEmptyReplyError,
} from 'redis-smq-common';
import {
  EConsumeMessageUnacknowledgedCause,
  IConsumerMessageHandlerArgs,
} from '../../../../types';
import { Consumer } from '../consumer';
import { events } from '../../../common/events/events';
import { MultiplexedMessageHandler } from './multiplexed-message-handler';
import { Configuration } from '../../../config/configuration';

export class MultiplexedMessageHandlerRunner extends MessageHandlerRunner {
  protected muxRedisClient: RedisClient | null = null;
  protected ticker: Ticker;
  protected index = 0;
  protected activeMessageHandler: MessageHandler | null | undefined = null;
  protected multiplexingDelay = true;

  constructor(consumer: Consumer, logger: ILogger) {
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
    handlerParams: IConsumerMessageHandlerArgs,
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
    handlerParams: IConsumerMessageHandlerArgs,
    cb: ICallback<void>,
  ): void {
    const client = this.getMuxRedisClient();
    const handler = this.createMessageHandlerInstance(client, handlerParams);
    handler.run(cb);
  }

  protected getMuxRedisClient(): RedisClient {
    if (!this.muxRedisClient) {
      throw new PanicError('Expected a non-empty value');
    }
    return this.muxRedisClient;
  }

  protected override shutdownMessageHandler(
    messageHandler: MessageHandler,
    messageUnacknowledgedCause: EConsumeMessageUnacknowledgedCause,
    cb: ICallback<void>,
  ): void {
    super.shutdownMessageHandler(
      messageHandler,
      messageUnacknowledgedCause,
      () => {
        if (messageHandler === this.activeMessageHandler) {
          this.nextTick();
        }
        cb();
      },
    );
  }

  override run(redisClient: RedisClient, cb: ICallback<void>): void {
    async.waterfall(
      [
        (cb: ICallback<void>) => {
          const { redis: cfg } = Configuration.getSetConfig();
          redis.createInstance(cfg, (err, client) => {
            if (err) cb(err);
            else if (!client) cb(new CallbackEmptyReplyError());
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
