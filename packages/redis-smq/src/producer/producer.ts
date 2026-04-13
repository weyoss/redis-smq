/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  async,
  createLogger,
  ICallback,
  ILogger,
  IRedisClient,
  PanicError,
  Runnable,
} from 'redis-smq-common';
import { TProducerEvent } from '../event-bus/index.js';
import { RedisConnectionPool } from '../common/redis/redis-connection-pool/redis-connection-pool.js';
import { ERedisConnectionAcquisitionMode } from '../common/redis/redis-connection-pool/types/connection-pool.js';
import { Configuration } from '../config-manager/configuration.js';
import {
  MessageExchangeRequiredError,
  NoMatchingQueuesError,
  ProducerNotRunningError,
  QueueHasNoConsumerGroupsError,
  RoutingKeyRequiredError,
} from '../errors/index.js';
import {
  EExchangeType,
  ExchangeDirect,
  ExchangeFanout,
  ExchangeTopic,
  IExchangeParsedParams,
} from '../exchange/index.js';
import { ProducibleMessage } from '../message/index.js';
import { MessageEnvelope } from '../message/message-envelope.js';
import { IQueueParams } from '../queue-manager/index.js';
import { _publishMessage } from './_/_publish-message.js';
import { eventPublisher } from './event-publisher.js';
import { PubSubTargetResolver } from './pub-sub-target-resolver.js';

/**
 * Produces messages to queues or exchanges.
 *
 * Manages message publishing with support for direct queue delivery
 * and exchange-based routing (direct, topic, fanout).
 *
 * @example
 * const producer = new Producer();
 * await producer.run();
 *
 * const msg = new ProducibleMessage()
 *   .setQueue({ name: 'orders', ns: 'default' })
 *   .setBody({ orderId: 123 });
 *
 * const ids = await producer.produce(msg);
 */
export class Producer extends Runnable<TProducerEvent> {
  protected fanoutExchange: ExchangeFanout;
  protected directExchange: ExchangeDirect;
  protected topicExchange: ExchangeTopic;
  protected logger: ILogger;
  protected pubSubTargetResolver: PubSubTargetResolver | null = null;
  protected redisClient: IRedisClient | null = null;

  constructor() {
    super();
    this.logger = createLogger(
      Configuration.getConfig().logger,
      `${this.constructor.name}-${this.getId()}`,
    );
    this.directExchange = new ExchangeDirect();
    this.topicExchange = new ExchangeTopic();
    this.fanoutExchange = new ExchangeFanout();

    eventPublisher(this);
    this.logger.info(`Producer initialized`);
  }

  protected getRedisClient(): IRedisClient {
    if (!this.redisClient)
      throw new PanicError({ message: 'A RedisClient instance is required.' });
    return this.redisClient;
  }

  protected _runPubSubTargetResolver = (cb: ICallback): void => {
    this.logger.debug('Starting PubSubTargetResolver...');
    this.pubSubTargetResolver = new PubSubTargetResolver(this, this.logger);
    this.pubSubTargetResolver.run((err) => {
      if (err) {
        this.logger.error('Failed to start PubSubTargetResolver.', err);
      } else {
        this.logger.debug('PubSubTargetResolver has been started.');
      }
      cb(err);
    });
  };

  protected _shutdownPubSubTargetResolver = (cb: ICallback): void => {
    if (this.pubSubTargetResolver) {
      this.logger.debug('Shutting down PubSubTargetResolver...');
      this.pubSubTargetResolver.shutdown(() => {
        this.logger.debug('PubSubTargetResolver has been shut down.');
        this.pubSubTargetResolver = null;
        cb();
      });
    } else {
      cb();
    }
  };

  protected override goingUp(): ((cb: ICallback) => void)[] {
    return super.goingUp().concat([
      (cb: ICallback): void => {
        RedisConnectionPool.getInstance().acquire(
          ERedisConnectionAcquisitionMode.SHARED,
          (err, client) => {
            if (err) cb(err);
            else {
              this.redisClient = client ?? null;
              cb();
            }
          },
        );
      },
      (cb: ICallback) => {
        this.emit('producer.goingUp', this.id);
        cb();
      },
      this._runPubSubTargetResolver,
    ]);
  }

  protected override finalizeUp() {
    super.finalizeUp();
    this.emit('producer.up', this.id);
  }

  protected override goingDown(): ((cb: ICallback) => void)[] {
    this.emit('producer.goingDown', this.id);
    return [
      this._shutdownPubSubTargetResolver,
      (cb: ICallback) => {
        if (this.redisClient) {
          RedisConnectionPool.getInstance().release(this.redisClient);
          this.redisClient = null;
        }
        cb();
      },
    ].concat(super.goingDown());
  }

  protected override finalizeDown(): void {
    super.finalizeDown();
    this.emit('producer.down', this.id);
  }

  protected getPubSubTargetResolver(): PubSubTargetResolver {
    if (!this.pubSubTargetResolver) {
      throw new PanicError({
        message: 'Expected PubSubTargetResolver to be running.',
      });
    }
    return this.pubSubTargetResolver;
  }

  protected _dispatch(
    message: MessageEnvelope,
    queue: IQueueParams,
    cb: ICallback<string>,
  ): void {
    message.setDestinationQueue(queue);
    const messageId = message.getId();
    const queueName = `${queue.name}@${queue.ns}`;

    const ts = Date.now();
    if (message.isSchedulable()) {
      message
        .getMessageState()
        .setScheduledAt(ts)
        .setLastScheduledAt(ts)
        .incrScheduledTimes();
    } else {
      message.getMessageState().setPublishedAt(ts);
    }

    _publishMessage(this.getRedisClient(), message, this.logger, (err) => {
      if (err) {
        this.logger.error(
          `Failed to dispatch message [${messageId}] to queue [${queueName}].`,
          err,
        );
        cb(err);
      } else {
        const action = message.isSchedulable() ? 'scheduled' : 'published';
        this.logger.info(
          `Message [${messageId}] has been ${action} to queue [${queueName}].`,
        );
        if (!message.isSchedulable()) {
          this.emit(
            'producer.messagePublished',
            messageId,
            {
              queueParams: queue,
              groupId: message.getConsumerGroupId(),
            },
            this.id,
          );
        }
        cb(null, messageId);
      }
    });
  }

  protected _produceToQueue(
    message: ProducibleMessage,
    queue: IQueueParams,
    cb: ICallback<string[]>,
  ): void {
    const queueName = `${queue.name}@${queue.ns}`;
    const { isPubSub, targets } =
      this.getPubSubTargetResolver().resolveTargets(queue);

    if (isPubSub) {
      if (!targets.length) {
        this.logger.error(
          `Queue [${queueName}] is PUB/SUB but has no consumer groups.`,
        );
        return cb(new QueueHasNoConsumerGroupsError());
      }

      const ids: string[] = [];
      this.logger.debug(
        `Fanning out message to [${targets.length}] consumer groups for queue [${queueName}].`,
      );

      async.eachOf(
        targets,
        (groupId, _, done) => {
          const msg = new MessageEnvelope(message).setConsumerGroupId(groupId);
          this._dispatch(msg, queue, (err, reply) => {
            if (err) return done(err);
            if (reply) ids.push(reply);
            done();
          });
        },
        (err) => {
          if (err) {
            this.logger.error(
              `Failed to produce messages to one or more consumer groups for queue [${queueName}].`,
              err,
            );
            return cb(err);
          }
          this.logger.info(
            `Successfully produced [${ids.length}] messages to queue [${queueName}].`,
          );
          cb(null, ids);
        },
      );
    } else {
      const msg = new MessageEnvelope(message);
      this._dispatch(msg, queue, (err, reply) => {
        if (err) {
          this.logger.error(
            `Failed to produce message to queue [${queueName}].`,
            err,
          );
          return cb(err);
        }
        this.logger.info(
          `Successfully produced message [${reply}] to queue [${queueName}].`,
        );
        cb(null, reply ? [reply] : []);
      });
    }
  }

  protected _matchExchangeQueues(
    exchange: IExchangeParsedParams,
    routingKey: string | null,
    cb: ICallback<IQueueParams[]>,
  ): void {
    if (exchange.type === EExchangeType.DIRECT) {
      if (!routingKey) return cb(new RoutingKeyRequiredError());
      return this.directExchange.matchQueues(exchange, routingKey, cb);
    }
    if (exchange.type === EExchangeType.TOPIC) {
      if (!routingKey) return cb(new RoutingKeyRequiredError());
      return this.topicExchange.matchQueues(exchange, routingKey, cb);
    }
    if (exchange.type === EExchangeType.FANOUT) {
      return this.fanoutExchange.matchQueues(exchange, cb);
    }
    cb(new PanicError({ message: 'Unsupported exchange type.' }));
  }

  /**
   * Publishes a message to a queue or exchange.
   *
   * @param msg - Message to publish (must have queue or exchange)
   * @param cb - (err, messageIds) => void. Returns string[]
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * // Promise - direct to queue
   * const msg = new ProducibleMessage()
   *   .setQueue({ name: 'orders', ns: 'default' })
   *   .setBody({ orderId: 123 });
   * const ids = await producer.produce(msg);
   *
   * // Callback - exchange routing
   * const exchangeMsg = new ProducibleMessage()
   *   .setExchange({ name: 'events', ns: 'system', type: 'topic' })
   *   .setExchangeRoutingKey('user.created');
   * producer.produce(exchangeMsg, (err, ids) => {
   *   if (err) throw err;
   *   console.log(ids);
   * });
   */
  produce(msg: ProducibleMessage): Promise<string[]>;
  produce(msg: ProducibleMessage, cb: ICallback<string[]>): void;
  produce(
    msg: ProducibleMessage,
    cb?: ICallback<string[]>,
  ): Promise<string[]> | void {
    return async.withOptionalCallback(cb, (callback) => {
      if (!this.isOperational()) {
        this.logger.error('Cannot produce message. Producer is not running.');
        return callback(new ProducerNotRunningError());
      }

      const queueParams = msg.getQueue();
      if (queueParams) {
        return this._produceToQueue(msg, queueParams, callback);
      }

      const exchangeParams = msg.getExchange();
      if (!exchangeParams) {
        this.logger.error(
          'Message can not be produced without a queue or an exchange.',
        );
        return callback(new MessageExchangeRequiredError());
      }

      this.logger.debug(
        `Looking up queues for exchange [${exchangeParams.name}@${exchangeParams.ns}]...`,
      );
      this._matchExchangeQueues(
        exchangeParams,
        msg.getExchangeRoutingKey(),
        (err, queues) => {
          if (err) {
            this.logger.error('Failed to match queues for exchange.', err);
            return callback(err);
          }

          if (!queues?.length) {
            this.logger.error(
              `No queues found for exchange [${exchangeParams.name}@${exchangeParams.ns}].`,
            );
            return callback(new NoMatchingQueuesError());
          }

          this.logger.info(
            `Found [${queues.length}] matching queues for exchange.`,
          );
          const messageIds: string[] = [];

          async.eachOf(
            queues,
            (queue, index, done) => {
              this.logger.debug(
                `Producing message to queue [${queue.name}@${queue.ns}] (${index + 1}/${queues.length}).`,
              );
              this._produceToQueue(msg, queue, (err, reply) => {
                if (err) {
                  this.logger.error(
                    `Failed to produce message to queue [${queue.name}@${queue.ns}].`,
                    err,
                  );
                  return done(err);
                }
                if (reply) {
                  messageIds.push(...reply);
                }
                done();
              });
            },
            (err) => {
              if (err) {
                this.logger.error(
                  'An error occurred while producing messages to one or more queues.',
                  err,
                );
                return callback(err);
              }
              this.logger.info(
                `Successfully produced [${messageIds.length}] messages across [${queues.length}] queues.`,
              );
              callback(null, messageIds);
            },
          );
        },
      );
    });
  }
}
