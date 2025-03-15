/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { stat } from 'fs';
import path from 'path';
import {
  CallbackEmptyReplyError,
  ICallback,
  ILogger,
  Runnable,
  WorkerCallable,
} from 'redis-smq-common';
import { TConsumerConsumeMessageEvent } from '../../../../common/index.js';
import { RedisClient } from '../../../../common/redis-client/redis-client.js';
import { ELuaScriptName } from '../../../../common/redis-client/scripts/scripts.js';
import { redisKeys } from '../../../../common/redis-keys/redis-keys.js';
import { Configuration } from '../../../../config/index.js';
import { EventBus } from '../../../event-bus/index.js';
import {
  EMessageProperty,
  EMessagePropertyStatus,
  IMessageTransferable,
} from '../../../message/index.js';
import { MessageEnvelope } from '../../../message/message-envelope.js';
import { IQueueParsedParams } from '../../../queue/index.js';
import { Consumer } from '../../consumer/consumer.js';
import {
  EMessageUnknowledgmentAction,
  EMessageUnknowledgmentReason,
  TConsumerMessageHandler,
} from '../../types/index.js';
import {
  ConsumerMessageHandlerFileError,
  ConsumerMessageHandlerFilenameExtensionError,
} from '../errors/index.js';
import { processingQueue } from '../processing-queue/processing-queue.js';
import { eventBusPublisher } from './event-bus-publisher.js';

export class ConsumeMessage extends Runnable<TConsumerConsumeMessageEvent> {
  protected logger;
  protected keyQueueProcessing;
  protected keyQueueAcknowledged;
  protected queue;
  protected consumerId;
  protected messageHandler;
  protected messageHandlerId;
  protected redisClient;
  protected consumeMessageWorker: WorkerCallable<
    IMessageTransferable,
    void
  > | null = null;

  constructor(
    redisClient: RedisClient,
    consumer: Consumer,
    queue: IQueueParsedParams,
    messageHandlerId: string,
    messageHandler: TConsumerMessageHandler,
    logger: ILogger,
    eventBus: EventBus | null,
  ) {
    super();
    this.queue = queue;
    this.consumerId = consumer.getId();
    this.messageHandler = messageHandler;
    this.messageHandlerId = messageHandlerId;
    this.redisClient = redisClient;
    const { keyQueueProcessing } = redisKeys.getQueueConsumerKeys(
      this.queue.queueParams,
      this.consumerId,
    );
    const { keyQueueAcknowledged } = redisKeys.getQueueKeys(
      this.queue.queueParams,
      this.queue.groupId,
    );
    this.keyQueueAcknowledged = keyQueueAcknowledged;
    this.keyQueueProcessing = keyQueueProcessing;
    this.logger = logger;
    if (eventBus) {
      eventBusPublisher(this, eventBus, logger);
    }
  }

  protected override getLogger(): ILogger {
    return this.logger;
  }

  protected acknowledgeMessage(message: MessageEnvelope): void {
    const messageId = message.getId();
    const { store, queueSize, expire } =
      Configuration.getSetConfig().messages.store.acknowledged;
    const { keyMessage } = redisKeys.getMessageKeys(messageId);
    const redisClient = this.redisClient.getInstance();
    if (redisClient instanceof Error) {
      this.handleError(redisClient);
      return void 0;
    }
    redisClient.runScript(
      ELuaScriptName.ACKNOWLEDGE_MESSAGE,
      [this.keyQueueProcessing, this.keyQueueAcknowledged, keyMessage],
      [
        EMessageProperty.STATUS,
        EMessagePropertyStatus.ACKNOWLEDGED,
        Number(store),
        expire,
        queueSize * -1,
      ],
      (err) => {
        if (err) this.handleError(err);
        else {
          this.emit(
            'consumer.consumeMessage.messageAcknowledged',
            messageId,
            this.queue,
            this.messageHandlerId,
            this.consumerId,
          );
        }
      },
    );
  }

  protected unacknowledgeMessage(
    msg: MessageEnvelope,
    unknowledgmentReason: EMessageUnknowledgmentReason,
  ): void {
    const redisClient = this.redisClient.getInstance();
    if (redisClient instanceof Error) {
      this.handleError(redisClient);
      return void 0;
    }
    processingQueue.unknowledgeMessage(
      redisClient,
      this.consumerId,
      [this.queue.queueParams],
      this.logger,
      unknowledgmentReason,
      (err, reply) => {
        if (err) this.handleError(err);
        else if (!reply) this.handleError(new CallbackEmptyReplyError());
        else {
          const messageId = msg.getId();
          this.emit(
            'consumer.consumeMessage.messageUnacknowledged',
            messageId,
            this.queue,
            this.messageHandlerId,
            this.consumerId,
            unknowledgmentReason,
          );
          const unknowledgment = reply[messageId];
          if (
            unknowledgment.action === EMessageUnknowledgmentAction.DEAD_LETTER
          ) {
            this.emit(
              'consumer.consumeMessage.messageDeadLettered',
              messageId,
              this.queue,
              this.messageHandlerId,
              this.consumerId,
              unknowledgment.deadLetterReason,
            );
          } else if (
            unknowledgment.action === EMessageUnknowledgmentAction.DELAY
          ) {
            this.emit(
              'consumer.consumeMessage.messageDelayed',
              messageId,
              this.queue,
              this.messageHandlerId,
              this.consumerId,
            );
          } else {
            this.emit(
              'consumer.consumeMessage.messageRequeued',
              messageId,
              this.queue,
              this.messageHandlerId,
              this.consumerId,
            );
          }
        }
      },
    );
  }

  protected getConsumeMessageWorker(messageHandlerFilename: string) {
    if (!this.consumeMessageWorker) {
      this.consumeMessageWorker = new WorkerCallable<
        IMessageTransferable,
        void
      >(messageHandlerFilename);
    }
    return this.consumeMessageWorker;
  }

  protected invokeMessageHandler(
    messageHandler: TConsumerMessageHandler,
    msg: IMessageTransferable,
    cb: ICallback<void>,
  ): void {
    if (typeof messageHandler === 'string') {
      this.getConsumeMessageWorker(messageHandler).call(msg, cb);
    } else messageHandler(msg, cb);
  }

  protected consumeMessage(msg: MessageEnvelope): void {
    let isTimeout = false;
    let timer: NodeJS.Timeout | null = null;
    try {
      const consumeTimeout = msg.producibleMessage.getConsumeTimeout();
      if (consumeTimeout) {
        timer = setTimeout(() => {
          isTimeout = true;
          timer = null;
          this.unacknowledgeMessage(msg, EMessageUnknowledgmentReason.TIMEOUT);
        }, consumeTimeout);
      }
      const onConsumed: ICallback<void> = (err) => {
        if (this.isRunning() && !isTimeout) {
          if (timer) clearTimeout(timer);
          if (err) {
            this.logger.error(err);
            this.unacknowledgeMessage(
              msg,
              EMessageUnknowledgmentReason.UNACKNOWLEDGED,
            );
          } else {
            this.acknowledgeMessage(msg);
          }
        }
      };
      this.invokeMessageHandler(
        this.messageHandler,
        msg.transfer(),
        onConsumed,
      );
    } catch (error: unknown) {
      this.logger.error(error);
      this.unacknowledgeMessage(
        msg,
        EMessageUnknowledgmentReason.CONSUME_ERROR,
      );
    }
  }

  protected validateMessageHandler = (cb: ICallback<void>): void => {
    if (typeof this.messageHandler === 'string') {
      if (!['.js', '.cjs'].includes(path.extname(this.messageHandler))) {
        cb(new ConsumerMessageHandlerFilenameExtensionError());
      } else
        stat(this.messageHandler, (err) => {
          if (err) cb(new ConsumerMessageHandlerFileError());
          else cb();
        });
    } else cb();
  };

  protected override goingUp(): ((cb: ICallback<void>) => void)[] {
    return super
      .goingUp()
      .concat([this.redisClient.init, this.validateMessageHandler]);
  }

  protected override goingDown(): ((cb: ICallback<void>) => void)[] {
    return [
      (cb: ICallback<void>) => {
        if (this.consumeMessageWorker) {
          this.consumeMessageWorker.shutdown(cb);
        } else cb();
      },
    ].concat(super.goingDown());
  }

  protected override handleError(err: Error) {
    this.emit(
      'consumer.consumeMessage.error',
      err,
      this.consumerId,
      this.queue,
    );
    super.handleError(err);
  }

  handleReceivedMessage(message: MessageEnvelope): void {
    if (this.isRunning()) {
      if (message.getSetExpired()) {
        this.unacknowledgeMessage(
          message,
          EMessageUnknowledgmentReason.TTL_EXPIRED,
        );
      } else this.consumeMessage(message);
    }
  }
}
