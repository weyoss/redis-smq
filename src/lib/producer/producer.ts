/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  async,
  CallbackEmptyReplyError,
  ICallback,
  ILogger,
  IRedisClient,
  logger,
  PanicError,
  Runnable,
  TUnaryFunction,
} from 'redis-smq-common';
import { TProducerEvent } from '../../common/index.js';
import { RedisClientFactory } from '../../common/redis-client/redis-client-factory.js';
import { ELuaScriptName } from '../../common/redis-client/scripts/scripts.js';
import { redisKeys } from '../../common/redis-keys/redis-keys.js';
import { Configuration } from '../../config/index.js';
import { EventBusRedisFactory } from '../event-bus/event-bus-redis-factory.js';
import { _getExchangeQueues } from '../exchange/_/_get-exchange-queues.js';
import { EExchangeType } from '../exchange/index.js';
import {
  EMessageProperty,
  EMessagePropertyStatus,
  ProducibleMessage,
} from '../message/index.js';
import { MessageEnvelope } from '../message/message-envelope.js';
import { EQueueProperty, EQueueType, IQueueParams } from '../queue/index.js';
import { _scheduleMessage } from './_/_schedule-message.js';
import {
  ProducerInstanceNotRunningError,
  ProducerMessageExchangeRequiredError,
  ProducerMessageNotPublishedError,
  ProducerQueueWithoutConsumerGroupsError,
} from './errors/index.js';
import { eventBusPublisher } from './event-bus-publisher.js';
import { QueueConsumerGroupsCache } from './queue-consumer-groups-cache.js';

export class Producer extends Runnable<TProducerEvent> {
  protected logger;
  protected redisClient;
  protected eventBus;
  protected queueConsumerGroupsHandler: QueueConsumerGroupsCache | null = null;

  constructor() {
    super();
    this.redisClient = RedisClientFactory(this.id, (err) =>
      this.handleError(err),
    );
    this.eventBus = EventBusRedisFactory(this.id, (err) =>
      this.handleError(err),
    );
    this.logger = logger.getLogger(
      Configuration.getSetConfig().logger,
      `producer:${this.id}`,
    );
    if (Configuration.getSetConfig().eventBus.enabled) {
      eventBusPublisher(this, this.logger);
    }
  }

  protected override getLogger(): ILogger {
    return this.logger;
  }

  protected initQueueConsumerGroupsHandler = (cb: ICallback<void>): void => {
    this.queueConsumerGroupsHandler = new QueueConsumerGroupsCache(
      this.id,
      this.logger,
    );
    this.queueConsumerGroupsHandler.run((err) => cb(err));
  };

  protected shutDownQueueConsumerGroupsHandler = (
    cb: ICallback<void>,
  ): void => {
    if (this.queueConsumerGroupsHandler) {
      this.queueConsumerGroupsHandler.shutdown(() => {
        this.queueConsumerGroupsHandler = null;
        cb();
      });
    } else cb();
  };

  protected initRedisClient = (cb: ICallback<void>): void =>
    this.redisClient.getSetInstance((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new CallbackEmptyReplyError());
      else {
        client.on('error', (err) => this.handleError(err));
        cb();
      }
    });

  protected override goingUp(): TUnaryFunction<ICallback<void>>[] {
    return super.goingUp().concat([
      this.redisClient.init,
      this.eventBus.init,
      (cb: ICallback<void>) => {
        this.emit('producer.goingUp', this.id);
        cb();
      },
      this.initRedisClient,
      this.initQueueConsumerGroupsHandler,
    ]);
  }

  protected override up(cb: ICallback<boolean>) {
    super.up(() => {
      this.emit('producer.up', this.id);
      cb(null, true);
    });
  }

  protected override goingDown(): TUnaryFunction<ICallback<void>>[] {
    this.emit('producer.goingDown', this.id);
    return [
      this.shutDownQueueConsumerGroupsHandler,
      this.redisClient.shutdown,
    ].concat(super.goingDown());
  }

  protected override down(cb: ICallback<boolean>) {
    super.down(() => {
      this.emit('producer.down', this.id);
      setTimeout(() => this.eventBus.shutdown(() => cb(null, true)), 1000);
    });
  }

  protected getQueueConsumerGroupsHandler(): QueueConsumerGroupsCache {
    if (!this.queueConsumerGroupsHandler)
      throw new PanicError(
        `Expected an instance of QueueConsumerGroupsHandler`,
      );
    return this.queueConsumerGroupsHandler;
  }

  protected enqueue(
    redisClient: IRedisClient,
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
    redisClient: IRedisClient,
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
            'producer.messagePublished',
            messageId,
            { queueParams: queue, groupId: message.getConsumerGroupId() },
            this.id,
          );
          cb(null, messageId);
        }
      });
  }

  protected produceMessage(
    redisClient: IRedisClient,
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
    if (!this.isUp()) cb(new ProducerInstanceNotRunningError());
    else {
      const redisClient = this.redisClient.getInstance();
      if (redisClient instanceof Error) {
        cb(redisClient);
        return void 0;
      }
      const exchangeParams = msg.getExchange();
      if (!exchangeParams) cb(new ProducerMessageExchangeRequiredError());
      else if (exchangeParams.type === EExchangeType.DIRECT) {
        const queue = exchangeParams.params;
        this.produceMessage(redisClient, msg, queue, cb);
      } else {
        _getExchangeQueues(redisClient, exchangeParams, (err, queues) => {
          if (err) cb(err);
          else if (!queues?.length)
            cb(
              new ProducerMessageNotPublishedError(
                `The exchange does not match any queue.`,
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
