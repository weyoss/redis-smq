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
import { _fromMessage } from '../../message/_from-message';
import { Configuration } from '../../../config/configuration';

export class ConsumeMessage {
  protected keyQueueProcessing: string;
  protected messageHandler: MessageHandler;
  protected redisClient: RedisClient;
  protected logger: ILogger;

  constructor(
    messageHandler: MessageHandler,
    redisClient: RedisClient,
    logger: ILogger,
  ) {
    this.redisClient = redisClient;
    this.messageHandler = messageHandler;
    const { keyQueueProcessing } = redisKeys.getQueueConsumerKeys(
      messageHandler.getQueue(),
      messageHandler.getConsumerId(),
    );
    this.keyQueueProcessing = keyQueueProcessing;
    this.logger = logger;
  }

  protected acknowledgeMessage(
    message: MessageEnvelope,
    cb: ICallback<void>,
  ): void {
    const messageId = message.getRequiredId();
    const queue = message.getDestinationQueue();
    const { keyQueueAcknowledged } = redisKeys.getQueueKeys(queue);
    const { store, queueSize, expire } =
      Configuration.getSetConfig().messages.store.acknowledged;
    const { keyMessage } = redisKeys.getMessageKeys(messageId);
    this.redisClient.runScript(
      ELuaScriptName.ACKNOWLEDGE_MESSAGE,
      [this.keyQueueProcessing, keyQueueAcknowledged, keyMessage],
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
      [this.messageHandler.getQueue()],
      this.logger,
      cause,
      (err, reply) => {
        if (err) this.messageHandler.handleError(err);
        else if (!reply)
          this.messageHandler.handleError(new CallbackEmptyReplyError());
        else {
          const messageId = msg.getRequiredId();
          const queue = msg.getDestinationQueue();
          const messageHandlerId = this.messageHandler.getId();
          const consumerId = this.messageHandler.getConsumerId();
          this.messageHandler.emit(
            'messageUnacknowledged',
            cause,
            messageId,
            queue,
            messageHandlerId,
            consumerId,
          );
          if (reply.action === ERetryAction.DEAD_LETTER) {
            this.messageHandler.emit(
              'messageDeadLettered',
              reply.deadLetterCause,
              messageId,
              queue,
              messageHandlerId,
              consumerId,
            );
          } else if (reply.action === ERetryAction.DELAY) {
            this.messageHandler.emit(
              'messageDelayed',
              messageId,
              queue,
              messageHandlerId,
              consumerId,
            );
          } else {
            this.messageHandler.emit(
              'messageRequeued',
              messageId,
              queue,
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
      const consumeTimeout = msg.getConsumeTimeout();
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
                  msg.getRequiredId(),
                  msg.getDestinationQueue(),
                  this.messageHandler.getId(),
                  this.messageHandler.getConsumerId(),
                );
            });
          }
        }
      };

      // As a safety measure, in case if we mess with message system
      // properties, only a clone of the message is actually given
      this.messageHandler.getHandler()(
        _fromMessage(msg, msg.getStatus(), msg.getMessageState()),
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
