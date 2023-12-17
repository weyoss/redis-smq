/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { MessageEnvelope } from '../message/message-envelope';
import { Base } from '../base';
import {
  async,
  RedisClient,
  ICallback,
  TUnaryFunction,
  CallbackEmptyReplyError,
} from 'redis-smq-common';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { ProducerMessageNotPublishedError } from './errors';
import { ELuaScriptName } from '../../common/redis-client/redis-client';
import { _scheduleMessage } from './_schedule-message';
import { ProducerInstanceNotRunningError } from './errors';
import {
  EMessageProperty,
  EMessagePropertyStatus,
  EQueueProperty,
  EQueueType,
  IQueueParams,
} from '../../../types';
import { ExchangeDirect } from '../exchange/exchange-direct';
import { _getQueueParams } from '../queue/queue/_get-queue-params';
import { Configuration } from '../../config/configuration';
import { ProducibleMessage } from '../message/producible-message';

export class Producer extends Base {
  protected initProducerEventListeners = (cb: ICallback<void>): void => {
    this.registerEventListeners(
      Configuration.getSetConfig().eventListeners.producerEventListeners,
      cb,
    );
  };

  protected override goingUp(): TUnaryFunction<ICallback<void>>[] {
    return super.goingUp().concat([this.initProducerEventListeners]);
  }

  protected enqueue(
    redisClient: RedisClient,
    queue: IQueueParams,
    message: MessageEnvelope,
    cb: ICallback<void>,
  ): void {
    const messageState = message.getMessageState();
    messageState.setPublishedAt(Date.now());
    const messageId = message.getId();
    const {
      keyQueueProperties,
      keyPriorityQueuePending,
      keyQueuePending,
      keyQueueMessages,
    } = redisKeys.getQueueKeys(queue);
    const { keyMessage } = redisKeys.getMessageKeys(messageId);
    redisClient.runScript(
      ELuaScriptName.PUBLISH_MESSAGE,
      [
        keyQueueProperties,
        keyPriorityQueuePending,
        keyQueuePending,
        keyMessage,
      ],
      [
        EQueueProperty.QUEUE_TYPE,
        EQueueProperty.MESSAGES_COUNT,
        EQueueType.PRIORITY_QUEUE,
        EQueueType.LIFO_QUEUE,
        EQueueType.FIFO_QUEUE,
        message.producibleMessage.getPriority() ?? '',
        keyQueueMessages, // Passing as argument. Final key will be computed dynamically
        messageId,
        EMessageProperty.STATUS,
        EMessagePropertyStatus.PENDING,
        EMessageProperty.STATE,
        JSON.stringify(messageState),
        EMessageProperty.MESSAGE,
        JSON.stringify(message.toJSON()),
      ],
      (err, reply) => {
        if (err) cb(err);
        else if (reply !== 'OK')
          cb(
            new ProducerMessageNotPublishedError(
              reply ? String(reply) : undefined,
            ),
          );
        else cb();
      },
    );
  }

  protected produceMessage(
    redisClient: RedisClient,
    message: MessageEnvelope,
    queue: IQueueParams,
    cb: ICallback<string>,
  ): void {
    const messageId = message
      .setDestinationQueue(queue)
      .getMessageState()
      .getId();
    if (message.isSchedulable())
      _scheduleMessage(redisClient, message, (err) => {
        if (err) cb(err);
        else {
          this.logger.info(`Message (ID ${messageId}) has been scheduled.`);
          cb(null, messageId);
        }
      });
    else
      this.enqueue(redisClient, queue, message, (err) => {
        if (err) cb(err);
        else {
          this.logger.info(`Message (ID ${messageId}) has been published.`);
          this.emit('messagePublished', messageId, queue);
          cb(null, messageId);
        }
      });
  }

  produce(msg: ProducibleMessage, cb: ICallback<string[]>): void {
    if (!this.powerSwitch.isUp()) cb(new ProducerInstanceNotRunningError());
    else {
      const callback: ICallback<string[] | string> = (err, messages) => {
        if (err) cb(err);
        else if (!messages) cb(new CallbackEmptyReplyError());
        else {
          cb(null, typeof messages === 'string' ? [messages] : messages);
        }
      };
      const redisClient = this.getSharedRedisClient();
      const envelope = new MessageEnvelope(msg);
      const exchange = envelope.getExchange();
      if (exchange instanceof ExchangeDirect) {
        const queue = _getQueueParams(exchange.getBindingParams());
        this.produceMessage(redisClient, envelope, queue, callback);
      } else {
        exchange.getQueues((err, queues) => {
          if (err) cb(err);
          else if (!queues?.length)
            cb(
              new ProducerMessageNotPublishedError(
                `The exchange (${exchange.constructor.name}) does not match any queue.`,
              ),
            );
          else {
            const messages: string[] = [];
            async.eachOf(
              queues,
              (queue, index, done) => {
                const m = new MessageEnvelope(msg);
                this.produceMessage(redisClient, m, queue, (err, messageId) => {
                  if (err) done(err);
                  else {
                    messageId && messages.push(messageId);
                    done();
                  }
                });
              },
              (err) => {
                if (err) callback(err);
                else callback(null, messages);
              },
            );
          }
        });
      }
    }
  }
}
