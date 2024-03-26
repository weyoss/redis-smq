/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  CallbackEmptyReplyError,
  CallbackInvalidReplyError,
  ICallback,
  ILogger,
  Runnable,
} from 'redis-smq-common';
import {
  TConsumerMessageHandlerEvent,
  TRedisSMQEvent,
} from '../../../../common/index.js';
import { RedisClientFactory } from '../../../../common/redis-client/redis-client-factory.js';
import { RedisClientInstance } from '../../../../common/redis-client/redis-client-instance.js';
import { ELuaScriptName } from '../../../../common/redis-client/scripts/scripts.js';
import { redisKeys } from '../../../../common/redis-keys/redis-keys.js';
import { Configuration } from '../../../../config/index.js';
import { _fromMessage } from '../../../message/_/_from-message.js';
import {
  EMessageProperty,
  EMessagePropertyStatus,
} from '../../../message/index.js';
import { IQueueParsedParams } from '../../../queue/index.js';
import { Consumer } from '../../consumer/consumer.js';
import {
  EConsumeMessageUnacknowledgedCause,
  IConsumerMessageHandlerArgs,
} from '../../types/index.js';
import { ConsumeMessage } from '../consume-message/consume-message.js';
import { DequeueMessage } from '../dequeue-message/dequeue-message.js';
import { processingQueue } from '../processing-queue.js';
import { evenBusPublisher } from './even-bus-publisher.js';

export class MessageHandler extends Runnable<TConsumerMessageHandlerEvent> {
  protected consumer;
  protected consumerId;
  protected queue;
  protected logger;
  protected dequeueMessage;
  protected consumeMessage;
  protected messageHandler;
  protected autoDequeue;
  protected redisClient;

  constructor(
    consumer: Consumer,
    logger: ILogger,
    handlerParams: IConsumerMessageHandlerArgs,
    autoDequeue: boolean = true,
  ) {
    super();
    const { queue, messageHandler } = handlerParams;
    this.consumer = consumer;
    this.consumerId = consumer.getId();
    this.queue = queue;
    this.messageHandler = messageHandler;
    this.logger = logger;
    this.autoDequeue = autoDequeue;
    this.redisClient = RedisClientFactory(this.consumerId, (err) =>
      this.handleError(err),
    );
    if (Configuration.getSetConfig().eventBus.enabled) {
      evenBusPublisher(this, this.consumerId, this.logger);
    }
    this.dequeueMessage = this.initDequeueMessageInstance();
    this.consumeMessage = this.initConsumeMessageInstance();
    this.registerSystemEvents();
  }

  protected initDequeueMessageInstance(): DequeueMessage {
    const instance = new DequeueMessage(
      new RedisClientInstance(),
      this.queue,
      this.consumerId,
      this.logger,
    );
    instance.on('consumer.dequeueMessage.error', this.onError);
    return instance;
  }

  protected initConsumeMessageInstance(): ConsumeMessage {
    const instance = new ConsumeMessage(
      this.redisClient,
      this.consumerId,
      this.queue,
      this.getId(),
      this.messageHandler,
      this.logger,
    );
    instance.on('consumer.consumeMessage.error', this.onError);
    return instance;
  }

  protected onMessageReceived: TRedisSMQEvent['consumer.dequeueMessage.messageReceived'] =
    (messageId) => {
      this.processMessage(messageId);
    };

  protected onMessageUnacknowledged: TRedisSMQEvent['consumer.consumeMessage.messageUnacknowledged'] =
    () => {
      this.next();
    };

  protected onMessageAcknowledged: TRedisSMQEvent['consumer.consumeMessage.messageAcknowledged'] =
    () => {
      this.next();
    };

  protected onMessageNext: TRedisSMQEvent['consumer.dequeueMessage.nextMessage'] =
    () => {
      this.next();
    };

  protected onError = (err: Error) => {
    // ignore errors that may occur during shutdown
    if (this.isRunning()) {
      this.handleError(err);
    }
  };

  protected registerSystemEvents = (): void => {
    this.dequeueMessage.on(
      'consumer.dequeueMessage.messageReceived',
      this.onMessageReceived,
    );
    this.dequeueMessage.on(
      'consumer.dequeueMessage.nextMessage',
      this.onMessageNext,
    );
    this.consumeMessage.on(
      'consumer.consumeMessage.messageUnacknowledged',
      this.onMessageUnacknowledged,
    );
    this.consumeMessage.on(
      'consumer.consumeMessage.messageAcknowledged',
      this.onMessageAcknowledged,
    );
  };

  protected cleanUp(cb: ICallback<void>): void {
    const redisClient = this.redisClient.getInstance();
    if (redisClient instanceof Error) {
      // ignoring errors
      cb();
      return void 0;
    }
    processingQueue.handleProcessingQueue(
      redisClient,
      [this.consumerId],
      [this.queue.queueParams],
      this.logger,
      EConsumeMessageUnacknowledgedCause.OFFLINE_MESSAGE_HANDLER,
      // ignoring errors
      () => cb(),
    );
  }

  protected override getLogger(): ILogger {
    return this.logger;
  }

  protected override handleError(err: Error) {
    if (this.isRunning()) {
      this.emit(
        'consumer.messageHandler.error',
        err,
        this.consumerId,
        this.queue,
      );
    }
    super.handleError(err);
  }

  protected override goingUp(): ((cb: ICallback<void>) => void)[] {
    return super.goingUp().concat([
      (cb: ICallback<void>) => this.dequeueMessage.run((err) => cb(err)),
      (cb: ICallback<void>) => this.consumeMessage.run((err) => cb(err)),
      (cb: ICallback<void>) => {
        if (this.autoDequeue) this.dequeue();
        cb();
      },
    ]);
  }

  protected override goingDown(): ((cb: ICallback<void>) => void)[] {
    return [
      (cb: ICallback<void>) => this.dequeueMessage.shutdown(() => cb()),
      (cb: ICallback<void>) => this.consumeMessage.shutdown(() => cb()),
      (cb: ICallback<void>) => this.cleanUp(cb),
    ].concat(super.goingDown());
  }

  processMessage(messageId: string): void {
    if (this.isRunning()) {
      const { keyMessage } = redisKeys.getMessageKeys(messageId);
      const keys: string[] = [keyMessage];
      const argv: (string | number)[] = [
        EMessageProperty.STATUS,
        EMessageProperty.STATE,
        EMessageProperty.MESSAGE,
        EMessagePropertyStatus.PROCESSING,
      ];
      const redisClient = this.redisClient.getInstance();
      if (redisClient instanceof Error) {
        this.handleError(redisClient);
        return void 0;
      }
      redisClient.runScript(
        ELuaScriptName.FETCH_MESSAGE_FOR_PROCESSING,
        keys,
        argv,
        (err, reply: unknown) => {
          if (err) this.handleError(err);
          else if (!reply) this.handleError(new CallbackEmptyReplyError());
          else if (!Array.isArray(reply))
            this.handleError(new CallbackInvalidReplyError());
          else {
            const [state, msg]: string[] = reply;
            const message = _fromMessage(
              msg,
              EMessagePropertyStatus.PROCESSING,
              state,
            );
            this.consumeMessage.handleReceivedMessage(message);
          }
        },
      );
    }
  }

  next(): void {
    this.dequeue();
  }

  dequeue(): void {
    if (this.isRunning()) {
      this.dequeueMessage.dequeue();
    }
  }

  getQueue(): IQueueParsedParams {
    return this.queue;
  }
}
