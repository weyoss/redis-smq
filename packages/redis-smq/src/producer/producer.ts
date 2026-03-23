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
 * The Producer class is a stateful service responsible for publishing messages
 * to the Redis-SMQ system. It manages the entire message delivery lifecycle,
 * including complex routing logic via exchanges, and ensures that all underlying
 * components are properly managed.
 *
 * @example
 * ```typescript
 * const producer = new Producer();
 *
 * // Using callback
 * producer.run((err) => {
 *   if (err) {
 *     console.error('Failed to start producer:', err);
 *     return;
 *   }
 *   console.log('Producer is running');
 * });
 *
 * // Using promise
 * await producer.run();
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
    this.directExchange = new ExchangeDirect();
    this.topicExchange = new ExchangeTopic();
    this.fanoutExchange = new ExchangeFanout();

    this.logger.debug('Initializing eventPublisher...');
    eventPublisher(this);
    this.logger.info(`Producer initialized`);
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
   */
  protected override finalizeUp() {
    super.finalizeUp();
    this.emit('producer.up', this.id);
  }

  /**
   * Defines the sequence of tasks to run when the Producer is shutting down.
   * This includes shutting down the `PubSubTargetResolver` and releasing the Redis connection.
   *
   * @returns An array of functions to be executed in series.
   */
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

  /**
   * A hook that runs after the producer has successfully shut down.
   *
   * This method finalizes the "down" state by:
   * - Logging the successful shutdown.
   * - Emitting the `producer.down` event to notify listeners.
   */
  protected override finalizeDown(): void {
    super.finalizeDown();
    this.emit('producer.down', this.id);
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
   * **State Requirements:**
   * - The producer must be operational (running) before calling this method.
   *   Use `producer.run()` to start the producer and `producer.ensureIsOperational()`
   *   to automatically start it if needed.
   *
   * **Error Handling:**
   * - If the producer is not running, a `ProducerNotRunningError` is returned.
   * - If the message has neither queue nor exchange, a `MessageExchangeRequiredError` is returned.
   * - For exchange routing, if no queues match, a `NoMatchingQueuesError` is returned.
   * - For PUB/SUB queues without consumer groups, a `QueueHasNoConsumerGroupsError` is returned.
   * - Various other errors may be returned from underlying operations (queue not found,
   *   consumer group not found, queue stopped, queue locked, etc.).
   *
   * @param msg - The message to be published. Must specify either a destination queue
   *              or an exchange (or both).
   * @param cb - Optional callback function invoked upon completion.
   *             - On success: `cb(null, messageIds)` where `messageIds` is an array of
   *               published message IDs (one per queue for exchange routing, or one for
   *               direct queue routing).
   *             - On error: `cb(error)` where `error` is one of the errors listed below.
   *             - If not provided, the method returns a Promise that resolves with the
   *               array of message IDs or rejects with an error.
   * @returns {Promise<string[]> | void} - Returns a Promise if no callback is provided,
   *          otherwise returns void.
   *
   * @throws {ProducerNotRunningError} When the producer is not running.
   * @throws {MessageExchangeRequiredError} When the message has neither queue nor exchange.
   * @throws {RoutingKeyRequiredError} When a routing key is required but not provided for DIRECT/TOPIC exchanges.
   * @throws {NoMatchingQueuesError} When the exchange matches no queues.
   * @throws {QueueHasNoConsumerGroupsError} When publishing to a PUB/SUB queue with no consumer groups.
   * @throws {QueueNotFoundError} When the target queue does not exist.
   * @throws {ConsumerGroupNotFoundError} When the consumer group does not exist (PUB/SUB).
   * @throws {MessagePriorityRequiredError} When priority is required but not set.
   * @throws {MessageAlreadyExistsError} When a message with the same ID already exists.
   * @throws {PriorityQueuingNotEnabledError} When priority queueing is not enabled.
   * @throws {InvalidQueueTypeError} When the queue type is invalid.
   * @throws {QueueStoppedError} When the target queue is stopped.
   * @throws {QueueLockedError} When the target queue is locked.
   * @throws {InvalidQueueStateError} When the queue is in an invalid state.
   * @throws {UnexpectedScriptReplyError} When Redis returns an unexpected response.
   *
   * @example
   * ```typescript
   * // Callback pattern
   * const producer = new Producer();
   * await producer.run();
   *
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
   *
   * // Promise pattern
   * try {
   *   const messageIds = await producer.produce(msg);
   *   console.log('Published message IDs:', messageIds);
   * } catch (err) {
   *   console.error('Failed to produce message:', err);
   * }
   *
   * // Direct-to-queue with callback
   * const directMsg = new ProducibleMessage()
   *   .setQueue({ name: 'orders', ns: 'processing' })
   *   .setBody({ orderId: 12345 });
   *
   * producer.produce(directMsg, (err, ids) => {
   *   if (err) console.error('Direct publish failed:', err);
   * });
   *
   * // Exchange-based routing with promise
   * const exchangeMsg = new ProducibleMessage()
   *   .setExchange({ name: 'events', ns: 'system', type: 'topic' })
   *   .setExchangeRoutingKey('user.created')
   *   .setBody({ userId: 456 });
   *
   * const ids = await producer.produce(exchangeMsg);
   * console.log(`Message published to ${ids.length} queues`);
   *
   * // Auto-start producer using ensureIsOperational
   * const autoStartProducer = new Producer();
   *
   * // This will automatically start the producer if needed
   * await autoStartProducer.ensureIsOperational();
   * await autoStartProducer.produce(msg);
   *
   * // Using ensureIsOperational with produce (callback)
   * const anotherProducer = new Producer();
   * anotherProducer.ensureIsOperational((err) => {
   *   if (err) return console.error('Failed to start:', err);
   *   anotherProducer.produce(msg, (err, ids) => {
   *     if (err) console.error('Publish failed:', err);
   *   });
   * });
   * ```
   *
   * @see {@link ProducibleMessage} For message configuration options.
   * @see {@link Exchange} For exchange types and routing patterns.
   * @see {@link Producer#run} For starting the producer.
   * @see {@link Producer#ensureIsOperational} For lazy initialization.
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
