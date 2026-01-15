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
import { TProducerEvent } from '../common/index.js';
import { RedisConnectionPool } from '../common/redis/redis-connection-pool/redis-connection-pool.js';
import { ERedisConnectionAcquisitionMode } from '../common/redis/redis-connection-pool/types/connection-pool.js';
import { Configuration } from '../config/index.js';
import {
  MessageExchangeRequiredError,
  NoMatchedQueuesForMessageExchangeError,
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
 * The Producer class is a stateful service responsible for publishing messages
 * to the Redis-SMQ system. It manages the entire message delivery lifecycle,
 * including complex routing logic via exchanges, and ensures that all underlying
 * components are properly managed.
 *
 * @example
 * ```typescript
 * const producer = new Producer();
 * producer.run((err) => {
 *   if (err) {
 *     console.error('Failed to start producer:', err);
 *     return;
 *   }
 *   console.log('Producer is running');
 * });
 * ```
 */
export class Producer extends Runnable<TProducerEvent> {
  protected fanoutExchange: ExchangeFanout;
  protected directExchange: ExchangeDirect;
  protected topicExchange: ExchangeTopic;
  protected logger: ILogger;
  protected pubSubTargetResolver: PubSubTargetResolver | null = null;
  protected redisClient: IRedisClient | null = null;

  /**
   * Initializes a new Producer instance.
   *
   * Note: The producer is not yet running after construction. Call `run()` to start it.
   */
  constructor() {
    super();
    this.logger = createLogger(
      Configuration.getConfig().logger,
      `${this.constructor.name}-${this.getId()}`,
    );
    this.logger.info(`Producer instance created`);

    this.directExchange = new ExchangeDirect();
    this.topicExchange = new ExchangeTopic();
    this.fanoutExchange = new ExchangeFanout();

    this.logger.debug('Initializing eventPublisher...');
    eventPublisher(this);
  }

  /**
   * Publishes a message to a queue or an exchange.
   *
   * This method orchestrates the message publication process and supports two main workflows:
   * 1.  **Direct-to-Queue**: If the message specifies a destination queue via `msg.getQueue()`,
   *     the message is sent directly to that queue.
   * 2.  **Exchange-Based Routing**: If the message specifies an exchange via `msg.getExchange()`,
   *     this method resolves the exchange to a set of matching queues and publishes a copy
   *     of the message to each one.
   *
   * The method performs the following validations:
   * - Ensures the producer is running; returns `ProducerNotRunningError` if not.
   * - Ensures the message specifies either a queue or an exchange; returns
   *   `MessageExchangeRequiredError` if neither is specified.
   * - For exchange-based routing, ensures at least one queue matches the exchange;
   *   returns `NoMatchedQueuesForMessageExchangeError` if no matches are found.
   *
   * @param msg - The message to be published. Must specify either a destination queue
   *              or an exchange (or both).
   * @param cb - A callback function invoked upon completion.
   *             - On success: `cb(null, messageIds)` where `messageIds` is an array of
   *               published message IDs (one per queue for exchange routing, or one for
   *               direct queue routing).
   *             - On error: `cb(error)` where `error` is one of:
   *               - `ProducerNotRunningError`: Producer is not running.
   *               - `MessageExchangeRequiredError`: Message has neither queue nor exchange.
   *               - `NoMatchedQueuesForMessageExchangeError`: Exchange matched no queues.
   *               - Other errors from queue or exchange operations.
   *
   * @throws ProducerNotRunningError
   * @throws MessageExchangeRequiredError
   * @throws RoutingKeyRequiredError
   * @throws NoMatchedQueuesForMessageExchangeError
   * @throws QueueHasNoConsumerGroupsError
   * @throws QueueNotFoundError
   * @throws ConsumerGroupNotFoundError
   * @throws MessagePriorityRequiredError
   * @throws MessageAlreadyExistsError
   * @throws PriorityQueuingNotEnabledError
   * @throws InvalidQueueTypeError
   * @throws UnexpectedScriptReplyError
   *
   * @example
   * ```typescript
   * const msg = new ProducibleMessage()
   *   .setQueue({ name: 'my-queue', ns: 'default' })
   *   .setBody({ data: 'example' });
   *
   * producer.produce(msg, (err, messageIds) => {
   *   if (err) {
   *     console.error('Failed to produce message:', err);
   *   } else {
   *     console.log('Published message IDs:', messageIds);
   *   }
   * });
   * ```
   */
  produce(msg: ProducibleMessage, cb: ICallback<string[]>): void {
    if (!this.isRunning()) {
      this.logger.error('Cannot produce message. Producer is not running.');
      return cb(new ProducerNotRunningError());
    }

    const queueParams = msg.getQueue();
    if (queueParams) {
      return this._produceToQueue(msg, queueParams, cb);
    }

    const exchangeParams = msg.getExchange();
    if (!exchangeParams) {
      this.logger.error(
        'Message can not be produced without a queue or an exchange.',
      );
      return cb(new MessageExchangeRequiredError());
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
          return cb(err);
        }

        if (!queues?.length) {
          this.logger.error(
            `No queues found for exchange [${exchangeParams.name}@${exchangeParams.ns}].`,
          );
          return cb(new NoMatchedQueuesForMessageExchangeError());
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
              return cb(err);
            }
            this.logger.info(
              `Successfully produced [${messageIds.length}] messages across [${queues.length}] queues.`,
            );
            cb(null, messageIds);
          },
        );
      },
    );
  }

  /**
   * Retrieves the active Redis client used for publishing messages.
   *
   * @returns The active Redis client.
   * @throws PanicError If the Redis client is not available, indicating
   *         the producer is not properly initialized or has been shut down.
   */
  protected getRedisClient(): IRedisClient {
    if (!this.redisClient)
      throw new PanicError({ message: 'A RedisClient instance is required.' });
    return this.redisClient;
  }

  /**
   * A lifecycle helper method that initializes and starts the `PubSubTargetResolver`.
   *
   * The `PubSubTargetResolver` is responsible for maintaining an in-memory cache
   * of consumer groups for PUB/SUB queues, enabling fast lookups during message
   * production without repeated Redis queries.
   *
   * @param cb - A callback function invoked upon completion.
   *             - On success: `cb(null)` or `cb()`.
   *             - On error: `cb(error)` if the resolver fails to start.
   */
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

  /**
   * A lifecycle helper method that gracefully shuts down the `PubSubTargetResolver`.
   *
   * @param cb - A callback function to be executed upon completion.
   */
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

  /**
   * Defines the sequence of tasks to run when the Producer is starting up.
   * This includes acquiring a Redis connection and starting the `PubSubTargetResolver`.
   *
   * @returns An array of functions to be executed in series.
   */
  protected override goingUp(): ((cb: ICallback) => void)[] {
    this.logger.info(`Producer is going up...`);
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

  /**
   * A hook that runs after the producer has successfully started. It finalizes
   * the "up" state and emits the `producer.up` event.
   *
   * @param cb - A callback function.
   */
  protected override up(cb: ICallback<boolean>) {
    super.up(() => {
      this.logger.info(`Producer is up.`);
      this.emit('producer.up', this.id);
      cb(null, true);
    });
  }

  /**
   * Defines the sequence of tasks to run when the Producer is shutting down.
   * This includes shutting down the `PubSubTargetResolver` and releasing the Redis connection.
   *
   * @returns An array of functions to be executed in series.
   */
  protected override goingDown(): ((cb: ICallback) => void)[] {
    this.logger.info(`Producer is going down...`);
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

  /**
   * A hook that runs after the producer has successfully shut down.
   *
   * This method finalizes the "down" state by:
   * - Logging the successful shutdown.
   * - Emitting the `producer.down` event to notify listeners.
   *
   * @param cb - A callback function invoked upon completion.
   *             - Always called with: `cb(null, true)`.
   */
  protected override down(cb: ICallback<boolean>): void {
    super.down(() => {
      this.logger.info(`Producer is down.`);
      this.emit('producer.down', this.id);
      cb(null, true);
    });
  }

  /**
   * Retrieves the active `PubSubTargetResolver` instance.
   *
   * This method is used internally to access the resolver for looking up consumer
   * groups for PUB/SUB queues during message production.
   *
   * @returns The `PubSubTargetResolver` instance.
   * @throws PanicError If the resolver is not initialized, indicating a critical
   *         internal error. This should never occur if the producer is running correctly.
   */
  protected getPubSubTargetResolver(): PubSubTargetResolver {
    if (!this.pubSubTargetResolver) {
      throw new PanicError({
        message: 'Expected PubSubTargetResolver to be running.',
      });
    }
    return this.pubSubTargetResolver;
  }

  /**
   * Prepares and dispatches a single message envelope to Redis.
   *
   * This is the final internal step before a message is handed off to the `_publishMessage`
   * script executor. It performs the following operations:
   * - Sets the destination queue on the message envelope.
   * - Sets appropriate timestamps based on whether the message is schedulable:
   *   - For schedulable messages: Sets `scheduledAt`, `lastScheduledAt`, and increments
   *     the scheduled times counter.
   *   - For non-schedulable messages: Sets `publishedAt`.
   * - Executes the Redis Lua script to persist the message.
   * - Emits the `producer.messagePublished` event for non-scheduled messages.
   *
   * @param message - The message envelope to dispatch. Must be a valid `MessageEnvelope` instance.
   * @param queue - The destination queue parameters (name and namespace).
   * @param cb - A callback function invoked upon completion.
   *             - On success: `cb(null, messageId)` where `messageId` is the ID of the published message.
   *             - On error: `cb(error)` if the message fails to publish to Redis.
   */
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

  /**
   * Produces a message to a single, specified queue, handling different delivery models.
   *
   * This method contains the core delivery logic and determines how a message is
   * delivered based on the queue's delivery model:
   *
   * **PUB/SUB Delivery Model:**
   * - Consults the `PubSubTargetResolver` to retrieve the list of consumer groups
   *   registered for the queue.
   * - If no consumer groups exist, returns `QueueHasNoConsumerGroupsError`.
   * - Otherwise, "fans out" the message by creating a distinct copy for each
   *   consumer group and dispatching each copy separately.
   *
   * **Other Delivery Models (FIFO, LIFO, etc.):**
   * - Publishes a single message directly to the queue without fan-out.
   *
   * @param message - The message to produce. Must be a valid `ProducibleMessage` instance.
   * @param queue - The destination queue parameters (name and namespace).
   * @param cb - A callback function invoked upon completion.
   *             - On success: `cb(null, messageIds)` where `messageIds` is an array of
   *               published message IDs (one per consumer group for PUB/SUB, or one for
   *               other delivery models).
   *             - On error: `cb(error)` where `error` is one of:
   *               - `QueueHasNoConsumerGroupsError`: Queue is PUB/SUB but has no consumer groups.
   *               - Other errors from message dispatch operations.
   */
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

  /**
   * A dispatcher method that routes a request to the correct exchange handler
   * based on the exchange type.
   *
   * This method acts as a router, delegating to the appropriate exchange implementation
   * based on the exchange type:
   * - **DIRECT**: Routes to `ExchangeDirect.matchQueues()`. Requires a routing key.
   * - **TOPIC**: Routes to `ExchangeTopic.matchQueues()`. Requires a routing key.
   * - **FANOUT**: Routes to `ExchangeFanout.matchQueues()`. Does not require a routing key.
   *
   * @param exchange - The exchange parameters (name, namespace, and type).
   * @param routingKey - The routing key used for matching. Required for DIRECT and TOPIC
   *                     exchanges; ignored for FANOUT exchanges. Pass `null` if not applicable.
   * @param cb - A callback function invoked upon completion.
   *             - On success: `cb(null, queues)` where `queues` is an array of matched
   *               queue parameters.
   *             - On error: `cb(error)` where `error` is one of:
   *               - `RoutingKeyRequiredError`: Routing key is required but not provided
   *                 for DIRECT or TOPIC exchanges.
   *               - `ProducerError`: Unsupported exchange type.
   *               - Other errors from exchange operations.
   */
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
}
