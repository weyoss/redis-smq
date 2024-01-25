/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { MessageEnvelope } from '../../message/message-envelope';
import {
  EConsumeMessageUnacknowledgedCause,
  EMessageProperty,
  EMessagePropertyStatus,
  IQueueParsedParams,
} from '../../../../types';
import { redisKeys } from '../../../common/redis-keys/redis-keys';
import { MessageHandler } from './message-handler';
import {
  CallbackEmptyReplyError,
  ICallback,
  ILogger,
  RedisClient,
} from 'redis-smq-common';
import { processingQueue } from './processing-queue';
import { ERetryAction } from './retry-message';
import { ELuaScriptName } from '../../../common/redis-client/redis-client';
import { Configuration } from '../../../config/configuration';
import { _createConsumableMessage } from '../../message/_create-consumable-message';

export class ConsumeMessage {
  protected messageHandler: MessageHandler;
  protected redisClient: RedisClient;
  protected logger: ILogger;
  protected keyQueueProcessing: string;
  protected keyQueueAcknowledged: string;
  protected queue: IQueueParsedParams;

  constructor(
    messageHandler: MessageHandler,
    redisClient: RedisClient,
    logger: ILogger,
  ) {
    this.redisClient = redisClient;
    this.messageHandler = messageHandler;
    this.queue = messageHandler.getQueue();
    const { keyQueueProcessing, keyQueueAcknowledged } =
      redisKeys.getQueueConsumerKeys(
        this.queue.queueParams,
        messageHandler.getConsumerId(),
        this.queue.groupId,
      );
    this.keyQueueAcknowledged = keyQueueAcknowledged;
    this.keyQueueProcessing = keyQueueProcessing;
    this.logger = logger;
  }

  protected acknowledgeMessage(
    message: MessageEnvelope,
    cb: ICallback<void>,
  ): void {
    const messageId = message.getId();
    const { store, queueSize, expire } =
      Configuration.getSetConfig().messages.store.acknowledged;
    const { keyMessage } = redisKeys.getMessageKeys(messageId);
    this.redisClient.runScript(
      ELuaScriptName.ACKNOWLEDGE_MESSAGE,
      [this.keyQueueProcessing, this.keyQueueAcknowledged, keyMessage],
      [
        EMessageProperty.STATUS,
        EMessagePropertyStatus.ACKNOWLEDGED,
        Number(store),
        expire,
        queueSize * -1,
      ],
      (err) => cb(err),
    );
  }

  protected unacknowledgeMessage(
    msg: MessageEnvelope,
    cause: EConsumeMessageUnacknowledgedCause,
  ): void {
    processingQueue.handleProcessingQueue(
      this.redisClient,
      [this.messageHandler.getConsumerId()],
      [this.queue.queueParams],
      this.logger,
      cause,
      (err, reply) => {
        if (err) this.messageHandler.handleError(err);
        else if (!reply)
          this.messageHandler.handleError(new CallbackEmptyReplyError());
        else {
          const messageId = msg.getId();
          const messageHandlerId = this.messageHandler.getId();
          const consumerId = this.messageHandler.getConsumerId();
          this.messageHandler.emit(
            'messageUnacknowledged',
            messageId,
            this.queue,
            messageHandlerId,
            consumerId,
            cause,
          );
          if (reply.action === ERetryAction.DEAD_LETTER) {
            this.messageHandler.emit(
              'messageDeadLettered',
              messageId,
              this.queue,
              messageHandlerId,
              consumerId,
              reply.deadLetterCause,
            );
          } else if (reply.action === ERetryAction.DELAY) {
            this.messageHandler.emit(
              'messageDelayed',
              messageId,
              this.queue,
              messageHandlerId,
              consumerId,
            );
          } else {
            this.messageHandler.emit(
              'messageRequeued',
              messageId,
              this.queue,
              messageHandlerId,
              consumerId,
            );
          }
        }
      },
    );
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
          this.unacknowledgeMessage(
            msg,
            EConsumeMessageUnacknowledgedCause.TIMEOUT,
          );
        }, consumeTimeout);
      }
      const onConsumed: ICallback<void> = (err) => {
        if (this.messageHandler.isRunning() && !isTimeout) {
          if (timer) clearTimeout(timer);
          if (err) {
            this.logger.error(err);
            this.unacknowledgeMessage(
              msg,
              EConsumeMessageUnacknowledgedCause.UNACKNOWLEDGED,
            );
          } else {
            this.acknowledgeMessage(msg, (err) => {
              if (err) this.messageHandler.handleError(err);
              else
                this.messageHandler.emit(
                  'messageAcknowledged',
                  msg.getId(),
                  this.queue,
                  this.messageHandler.getId(),
                  this.messageHandler.getConsumerId(),
                );
            });
          }
        }
      };
      this.messageHandler.getHandler()(
        _createConsumableMessage(msg),
        onConsumed,
      );
    } catch (error: unknown) {
      this.logger.error(error);
      this.unacknowledgeMessage(
        msg,
        EConsumeMessageUnacknowledgedCause.CONSUME_ERROR,
      );
    }
  }

  handleReceivedMessage(message: MessageEnvelope): void {
    if (message.getSetExpired()) {
      this.unacknowledgeMessage(
        message,
        EConsumeMessageUnacknowledgedCause.TTL_EXPIRED,
      );
    } else this.consumeMessage(message);
  }
}
