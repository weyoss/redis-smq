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
  ICallback,
  PanicError,
  RedisClient,
  TUnaryFunction,
} from 'redis-smq-common';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import {
  ProducerQueueWithoutConsumerGroupsError,
  ProducerInstanceNotRunningError,
  ProducerMessageExchangeRequiredError,
  ProducerMessageNotPublishedError,
} from './errors';
import { ELuaScriptName } from '../../common/redis-client/redis-client';
import { _scheduleMessage } from './_schedule-message';
import {
  EMessageProperty,
  EMessagePropertyStatus,
  EQueueProperty,
  EQueueType,
  IQueueParams,
} from '../../../types';
import { ExchangeDirect } from '../exchange/exchange-direct';
import { _parseQueueParams } from '../queue/queue/_parse-queue-params';
import { ProducibleMessage } from '../message/producible-message';
import { QueueConsumerGroupsDictionary } from './queue-consumer-groups-dictionary';

export class Producer extends Base {
  protected queueConsumerGroupsHandler: QueueConsumerGroupsDictionary | null =
    null;

  protected initQueueConsumerGroupsHandler = (cb: ICallback<void>): void => {
    this.queueConsumerGroupsHandler = new QueueConsumerGroupsDictionary(
      this.getSharedRedisClient(),
    );
    this.queueConsumerGroupsHandler.run(cb);
  };

  protected tearDownQueueConsumerGroupsHandler = (
    cb: ICallback<void>,
  ): void => {
    this.queueConsumerGroupsHandler?.quit(cb);
  };

  protected override goingUp(): TUnaryFunction<ICallback<void>>[] {
    return super.goingUp().concat([this.initQueueConsumerGroupsHandler]);
  }

  protected override goingDown(): TUnaryFunction<ICallback<void>>[] {
    return [this.tearDownQueueConsumerGroupsHandler].concat(super.goingDown());
  }

  protected override registerSystemEventListeners(): void {
    super.registerSystemEventListeners();
    if (this.hasEventListeners()) {
      this.on('messagePublished', (...args) => {
        this.eventListeners.forEach((i) => i.emit('messagePublished', ...args));
      });
    }
  }

  protected getQueueConsumerGroupsHandler(): QueueConsumerGroupsDictionary {
    if (!this.queueConsumerGroupsHandler)
      throw new PanicError(
        `Expected an instance of QueueConsumerGroupsHandler`,
      );
    return this.queueConsumerGroupsHandler;
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
    const keys = redisKeys.getQueueKeys(
      message.getDestinationQueue(),
      message.getConsumerGroupId(),
    );
    const { keyMessage } = redisKeys.getMessageKeys(messageId);
    redisClient.runScript(
      ELuaScriptName.PUBLISH_MESSAGE,
      [
        keys.keyQueueProperties,
        keys.keyQueuePriorityPending,
        keys.keyQueuePending,
        keys.keyQueueMessages,
        keyMessage,
      ],
      [
        EQueueProperty.QUEUE_TYPE,
        EQueueProperty.MESSAGES_COUNT,
        EQueueType.PRIORITY_QUEUE,
        EQueueType.LIFO_QUEUE,
        EQueueType.FIFO_QUEUE,
        message.producibleMessage.getPriority() ?? '',
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

  protected produceMessageItem(
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
          this.emit(
            'messagePublished',
            messageId,
            { queueParams: queue, groupId: message.getConsumerGroupId() },
            this.id,
          );
          cb(null, messageId);
        }
      });
  }

  protected produceMessage(
    redisClient: RedisClient,
    message: ProducibleMessage,
    queue: IQueueParams,
    cb: ICallback<string[]>,
  ): void {
    const { exists, consumerGroups } =
      this.getQueueConsumerGroupsHandler().getConsumerGroups(queue);
    if (exists) {
      if (!consumerGroups.length) {
        cb(new ProducerQueueWithoutConsumerGroupsError());
      }
      const ids: string[] = [];
      async.eachOf(
        consumerGroups,
        (group, _, done) => {
          const msg = new MessageEnvelope(message).setConsumerGroupId(group);
          this.produceMessageItem(redisClient, msg, queue, (err, reply) => {
            if (err) done(err);
            else {
              ids.push(String(reply));
              done();
            }
          });
        },
        (err) => {
          if (err) cb(err);
          else cb(null, ids);
        },
      );
    } else {
      const msg = new MessageEnvelope(message);
      this.produceMessageItem(redisClient, msg, queue, (err, reply) => {
        if (err) cb(err);
        else cb(null, [String(reply)]);
      });
    }
  }

  produce(msg: ProducibleMessage, cb: ICallback<string[]>): void {
    if (!this.powerSwitch.isUp()) cb(new ProducerInstanceNotRunningError());
    else {
      const redisClient = this.getSharedRedisClient();
      const exchange = msg.getExchange();
      if (!exchange) cb(new ProducerMessageExchangeRequiredError());
      else if (exchange instanceof ExchangeDirect) {
        const queue = _parseQueueParams(exchange.getBindingParams());
        if (queue instanceof Error) cb(queue);
        else this.produceMessage(redisClient, msg, queue, cb);
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
                this.produceMessage(redisClient, msg, queue, (err, reply) => {
                  if (err) done(err);
                  else {
                    reply && messages.push(...reply);
                    done();
                  }
                });
              },
              (err) => {
                if (err) cb(err);
                else cb(null, messages);
              },
            );
          }
        });
      }
    }
  }
}
