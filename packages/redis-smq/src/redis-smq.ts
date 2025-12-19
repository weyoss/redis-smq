/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { async, ICallback, IRedisConfig } from 'redis-smq-common';
import { Configuration, IRedisSMQConfig } from './config/index.js';
import {
  ExchangeDirect,
  ExchangeFanout,
  ExchangeTopic,
} from './exchange/index.js';
import { Producer } from './producer/producer.js';
import { Consumer } from './consumer/consumer.js';
import { QueueManager } from './queue-manager/index.js';
import { NamespaceManager } from './namespace-manager/index.js';
import { QueueMessages } from './queue-messages/index.js';
import { ConsumerGroups } from './consumer-groups/index.js';
import { QueueAcknowledgedMessages } from './queue-acknowledged-messages/index.js';
import { QueueDeadLetteredMessages } from './queue-dead-lettered-messages/index.js';
import { QueueScheduledMessages } from './queue-scheduled-messages/index.js';
import { QueuePendingMessages } from './queue-pending-messages/index.js';
import { QueueRateLimit } from './queue-rate-limit/index.js';
import { MessageManager } from './message-manager/index.js';
import { Disposable } from './common/types/disposable.js';
import { EventBus } from './event-bus/index.js';
import { parseRedisConfig } from './config/parse-redis-config.js';
import { RedisConnectionPool } from './common/redis/redis-connection-pool/redis-connection-pool.js';

function isDisposable(disposable: object): disposable is Disposable {
  return (
    disposable &&
    'shutdown' in disposable &&
    typeof disposable.shutdown === 'function'
  );
}

/**
 * Main RedisSMQ class providing a simplified API for Redis-based message queue operations.
 * Handles global Redis connection management and provides factory methods for creating
 * various queue-related components like producers, consumers, and message managers.
 * Must be initialized with Redis configuration before use.
 */
export class RedisSMQ {
  private static initialized = false;

  // Registry of components created via RedisSMQ factory methods
  private static readonly components = new Set<Disposable>();

  /**
   * Initializes RedisSMQ with Redis connection settings.
   * This is the simplest way to get started - just provide Redis connection once.
   *
   * @param redisConfig - Redis connection configuration
   * @param cb - Callback function called when initialization completes
   *
   * @example
   * ```typescript
   * import { RedisSMQ } from 'redis-smq';
   * import { ERedisConfigClient } from 'redis-smq-common';
   *
   * RedisSMQ.initialize({
   *   client: ERedisConfigClient.IOREDIS,
   *   options: {
   *     host: 'localhost',
   *     port: 6379,
   *     db: 0
   *   }
   * }, (err) => {
   *   if (err) {
   *     console.error('Failed to initialize RedisSMQ:', err);
   *     return;
   *   }
   *   console.log('RedisSMQ initialized successfully');
   *
   *   // Now you can create producers and consumers without Redis config!
   *   const producer = RedisSMQ.createProducer();
   *   const consumer = RedisSMQ.createConsumer();
   *
   *   producer.run((e) => {
   *     if (e) return console.error('Producer failed to start:', e);
   *     console.log('Producer ready');
   *   });
   *
   *   consumer.run((e) => {
   *     if (e) return console.error('Consumer failed to start:', e);
   *     console.log('Consumer ready');
   *   });
   * });
   * ```
   */
  static initialize(redisConfig: IRedisConfig, cb: ICallback): void {
    RedisSMQ.bootstrap(
      redisConfig,
      (cb: ICallback) => Configuration.initialize((err) => cb(err)),
      cb,
    );
  }

  /**
   * Initializes RedisSMQ with custom RedisSMQ configuration.
   * This method allows you to provide a complete RedisSMQ configuration that will be saved to Redis.
   * The Redis connection configuration is extracted from the provided RedisSMQ configuration.
   *
   * @param redisSMQConfig - Complete RedisSMQ configuration including Redis settings
   * @param cb - Callback function called when initialization completes
   *
   * @example
   * ```typescript
   * import { RedisSMQ } from 'redis-smq';
   * import { ERedisConfigClient } from 'redis-smq-common';
   *
   * RedisSMQ.initializeWithConfig({
   *   namespace: 'my-custom-app',
   *   redis: {
   *     client: ERedisConfigClient.IOREDIS,
   *     options: {
   *       host: 'localhost',
   *       port: 6379,
   *       db: 0
   *     }
   *   },
   *   logger: {
   *     enabled: true
   *   },
   *   eventBus: { enabled: true }
   * }, (err) => {
   *   if (err) {
   *     console.error('Failed to initialize RedisSMQ:', err);
   *   } else {
   *     console.log('RedisSMQ initialized with custom configuration');
   *   }
   * });
   * ```
   */
  static initializeWithConfig(
    redisSMQConfig: IRedisSMQConfig,
    cb: ICallback,
  ): void {
    const redisConfig = parseRedisConfig(redisSMQConfig.redis);
    RedisSMQ.bootstrap(
      redisConfig,
      (cb: ICallback) =>
        Configuration.initializeWithConfig(redisSMQConfig, (err) => cb(err)),
      cb,
    );
  }

  /**
   * Creates a Producer instance.
   *
   * @returns A new Producer instance
   * @throws Error if RedisSMQ is not initialized
   *
   * @example
   * ```typescript
   * const producer = RedisSMQ.createProducer();
   * producer.run((err) => {
   *   if (err) return console.error('Producer failed to start:', err);
   *   // Producer is ready to send messages
   * });
   * ```
   */
  static createProducer(): Producer {
    RedisSMQ.ensureInitialized();
    return RedisSMQ.trackComponent(new Producer());
  }

  /**
   * Creates a Consumer instance.
   *
   * @param enableMultiplexing - Optional flag to enable multiplexing
   * @returns A new Consumer instance
   * @throws Error if RedisSMQ is not initialized
   *
   * @example
   * ```typescript
   * const consumer = RedisSMQ.createConsumer();
   * consumer.run((err) => {
   *   if (err) return console.error('Consumer failed to start:', err);
   *   // Consumer is ready to receive messages
   * });
   * ```
   */
  static createConsumer(enableMultiplexing?: boolean): Consumer {
    RedisSMQ.ensureInitialized();
    return RedisSMQ.trackComponent(new Consumer(enableMultiplexing));
  }

  /**
   * Creates a MessageManager instance.
   *
   * @returns A new MessageManager instance
   * @throws Error if RedisSMQ is not initialized
   *
   * @example
   * ```typescript
   * const messageManager = RedisSMQ.createMessageManager();
   * messageManager.getMessageById('message-id', (err, message) => {
   *   if (err) return console.error('Failed to get message:', err);
   *   console.log('Message:', message);
   * });
   * ```
   */
  static createMessageManager(): MessageManager {
    RedisSMQ.ensureInitialized();
    return RedisSMQ.trackComponent(new MessageManager());
  }

  /**
   * Creates a QueueManager instance.
   *
   * @returns A new QueueManager instance
   * @throws Error if RedisSMQ is not initialized
   *
   * @example
   * ```typescript
   * import { EQueueType, EQueueDeliveryModel } from 'redis-smq';
   *
   * const queueManager = RedisSMQ.createQueueManager();
   * queueManager.save(
   *   'my-queue',
   *   EQueueType.LIFO_QUEUE,
   *   EQueueDeliveryModel.POINT_TO_POINT,
   *   (err, result) => {
   *     if (err) return console.error('Failed to create queue:', err);
   *     console.log('Queue created:', result);
   *   }
   * );
   * ```
   */
  static createQueueManager(): QueueManager {
    RedisSMQ.ensureInitialized();
    return RedisSMQ.trackComponent(new QueueManager());
  }

  /**
   * Creates a NamespaceManager instance.
   *
   * @returns A new NamespaceManager instance
   * @throws Error if RedisSMQ is not initialized
   *
   * @example
   * ```typescript
   * const namespaceManager = RedisSMQ.createNamespaceManager();
   * namespaceManager.getNamespaces((err, namespaces) => {
   *   if (err) return console.error('Failed to get namespaces:', err);
   *   console.log('Namespaces:', namespaces);
   * });
   * ```
   */
  static createNamespaceManager(): NamespaceManager {
    RedisSMQ.ensureInitialized();
    return RedisSMQ.trackComponent(new NamespaceManager());
  }

  /**
   * Creates a QueueMessages instance.
   *
   * @returns A new QueueMessages instance
   * @throws Error if RedisSMQ is not initialized
   *
   * @example
   * ```typescript
   * const queueMessages = RedisSMQ.createQueueMessages();
   * queueMessages.countMessagesByStatus('my-queue', (err, count) => {
   *   if (err) return console.error('Failed to count messages:', err);
   *   console.log('Counts:', count);
   * });
   * ```
   */
  static createQueueMessages(): QueueMessages {
    RedisSMQ.ensureInitialized();
    return RedisSMQ.trackComponent(new QueueMessages());
  }

  /**
   * Creates a ConsumerGroups instance.
   *
   * @returns A new ConsumerGroups instance
   * @throws Error if RedisSMQ is not initialized
   *
   * @example
   * ```typescript
   * const consumerGroups = RedisSMQ.createConsumerGroups();
   * consumerGroups.saveConsumerGroup('my-queue', 'group1', (err, result) => {
   *   if (err) return console.error('Failed to save group:', err);
   *   console.log('Group saved, code:', result);
   * });
   * ```
   */
  static createConsumerGroups(): ConsumerGroups {
    RedisSMQ.ensureInitialized();
    return RedisSMQ.trackComponent(new ConsumerGroups());
  }

  /**
   * Creates a QueueAcknowledgedMessages instance.
   *
   * @returns A new QueueAcknowledgedMessages instance
   * @throws Error if RedisSMQ is not initialized
   *
   * @example
   * ```typescript
   * const acknowledgedMessages = RedisSMQ.createQueueAcknowledgedMessages();
   * acknowledgedMessages.countMessages('my-queue', (err, count) => {
   *   if (err) return console.error('Failed to count acknowledged:', err);
   *   console.log('Acknowledged count:', count);
   * });
   * ```
   */
  static createQueueAcknowledgedMessages(): QueueAcknowledgedMessages {
    RedisSMQ.ensureInitialized();
    return RedisSMQ.trackComponent(new QueueAcknowledgedMessages());
  }

  /**
   * Creates a QueueDeadLetteredMessages instance.
   *
   * @returns A new QueueDeadLetteredMessages instance
   * @throws Error if RedisSMQ is not initialized
   *
   * @example
   * ```typescript
   * const deadLetteredMessages = RedisSMQ.createQueueDeadLetteredMessages();
   * deadLetteredMessages.countMessages('my-queue', (err, count) => {
   *   if (err) return console.error('Failed to count DLQ:', err);
   *   console.log('Dead-lettered count:', count);
   * });
   * ```
   */
  static createQueueDeadLetteredMessages(): QueueDeadLetteredMessages {
    RedisSMQ.ensureInitialized();
    return RedisSMQ.trackComponent(new QueueDeadLetteredMessages());
  }

  /**
   * Creates a QueueScheduledMessages instance.
   *
   * @returns A new QueueScheduledMessages instance
   * @throws Error if RedisSMQ is not initialized
   *
   * @example
   * ```typescript
   * const scheduledMessages = RedisSMQ.createQueueScheduledMessages();
   * scheduledMessages.countMessages('my-queue', (err, count) => {
   *   if (err) return console.error('Failed to count scheduled:', err);
   *   console.log('Scheduled count:', count);
   * });
   * ```
   */
  static createQueueScheduledMessages(): QueueScheduledMessages {
    RedisSMQ.ensureInitialized();
    return RedisSMQ.trackComponent(new QueueScheduledMessages());
  }

  /**
   * Creates a QueuePendingMessages instance.
   *
   * @returns A new QueuePendingMessages instance
   * @throws Error if RedisSMQ is not initialized
   *
   * @example
   * ```typescript
   * const pendingMessages = RedisSMQ.createQueuePendingMessages();
   * pendingMessages.countMessages('my-queue', (err, count) => {
   *   if (err) return console.error('Failed to count pending:', err);
   *   console.log('Pending count:', count);
   * });
   * ```
   */
  static createQueuePendingMessages(): QueuePendingMessages {
    RedisSMQ.ensureInitialized();
    return RedisSMQ.trackComponent(new QueuePendingMessages());
  }

  /**
   * Creates a QueueRateLimit instance.
   *
   * @returns A new QueueRateLimit instance
   * @throws Error if RedisSMQ is not initialized
   *
   * @example
   * ```typescript
   * const queueRateLimit = RedisSMQ.createQueueRateLimit();
   * queueRateLimit.set('my-queue', { interval: 1000, limit: 10 }, (err) => {
   *   if (err) return console.error('Failed to set rate limit:', err);
   *   console.log('Rate limit set');
   * });
   * ```
   */
  static createQueueRateLimit(): QueueRateLimit {
    RedisSMQ.ensureInitialized();
    return RedisSMQ.trackComponent(new QueueRateLimit());
  }

  /**
   * Creates a new fanout exchange instance.
   *
   * A fanout exchange routes messages to all queues bound to it, regardless of routing keys.
   * This is useful for broadcasting messages to multiple consumers.
   *
   * @returns {ExchangeFanout} A new fanout exchange instance
   * @throws {Error} If RedisSMQ is not initialized
   *
   * @example
   * ```typescript
   * import { RedisSMQ } from 'redis-smq';
   * import { ERedisConfigClient } from 'redis-smq-common';
   *
   * RedisSMQ.initialize({
   *   client: ERedisConfigClient.IOREDIS,
   *   options: { host: 'localhost', port: 6379 }
   * }, (err) => {
   *   if (err) return console.error('Init failed:', err);
   *
   *   const fanoutExchange = RedisSMQ.createFanoutExchange();
   *   fanoutExchange.saveExchange('notifications', (saveErr) => {
   *     if (saveErr) return console.error('Failed to save exchange:', saveErr);
   *     console.log('Fanout exchange saved');
   *   });
   * });
   * ```
   */
  static createFanoutExchange(): ExchangeFanout {
    RedisSMQ.ensureInitialized();
    return RedisSMQ.trackComponent(new ExchangeFanout());
  }

  /**
   * Creates a new topic exchange instance.
   *
   * A topic exchange routes messages to queues based on wildcard pattern matching
   * between the routing key and the binding pattern.
   *
   * @returns {ExchangeTopic} A new topic exchange instance
   * @throws {Error} If RedisSMQ is not initialized
   *
   * @example
   * ```typescript
   * import { RedisSMQ } from 'redis-smq';
   * import { ERedisConfigClient } from 'redis-smq-common';
   *
   * RedisSMQ.initialize({
   *   client: ERedisConfigClient.IOREDIS,
   *   options: { host: 'localhost', port: 6379 }
   * }, (err) => {
   *   if (err) return console.error('Init failed:', err);
   *
   *   const topicExchange = RedisSMQ.createTopicExchange();
   *   topicExchange.bindQueue('user-queue', {
   *     exchange: 'user-events',
   *     routingKey: 'user.*.created'
   *   }, (bindErr) => {
   *     if (bindErr) return console.error('Failed to bind queue:', bindErr);
   *     console.log('Queue bound to topic exchange');
   *   });
   * });
   * ```
   */
  static createTopicExchange(): ExchangeTopic {
    RedisSMQ.ensureInitialized();
    return RedisSMQ.trackComponent(new ExchangeTopic());
  }

  /**
   * Creates a new direct exchange instance.
   *
   * A direct exchange routes messages to queues based on exact routing key matches.
   * Messages are delivered to queues whose binding key exactly matches the routing key.
   *
   * @returns {ExchangeDirect} A new direct exchange instance
   * @throws {Error} If RedisSMQ is not initialized
   *
   * @example
   * ```typescript
   * import { RedisSMQ } from 'redis-smq';
   * import { ERedisConfigClient } from 'redis-smq-common';
   *
   * RedisSMQ.initialize({
   *   client: ERedisConfigClient.IOREDIS,
   *   options: { host: 'localhost', port: 6379 }
   * }, (err) => {
   *   if (err) return console.error('Init failed:', err);
   *
   *   const directExchange = RedisSMQ.createDirectExchange();
   *   directExchange.bindQueue('order-queue', {
   *     exchange: 'orders',
   *     routingKey: 'order.created'
   *   }, (bindErr) => {
   *     if (bindErr) return console.error('Failed to bind queue:', bindErr);
   *     console.log('Queue bound to direct exchange');
   *   });
   * });
   * ```
   */
  static createDirectExchange(): ExchangeDirect {
    RedisSMQ.ensureInitialized();
    return RedisSMQ.trackComponent(new ExchangeDirect());
  }

  /**
   * Gets the current Configuration instance.
   *
   * @returns The current Configuration instance
   * @throws Error if RedisSMQ is not initialized
   */
  static getConfigurationInstance(): Configuration {
    RedisSMQ.ensureInitialized();
    return Configuration.getInstance();
  }

  /**
   * Checks if RedisSMQ has been initialized.
   *
   * @returns True if initialized, false otherwise
   */
  static isInitialized(): boolean {
    return RedisSMQ.initialized;
  }

  /**
   * Resets RedisSMQ initialization state.
   * Useful for testing or reconfiguration.
   */
  static reset(): void {
    // For tests or reconfiguration scenarios, perform a full shutdown
    RedisSMQ.shutdown(() => void 0);
  }

  /**
   * Shuts down RedisSMQ and closes shared resources.
   *
   * This convenience method:
   * - Gracefully shuts down the Redis connection pool
   * - Closes the configuration Redis client
   * - Resets RedisSMQ initialization state
   *
   * Note: You should still shutdown any created components (e.g. Producer, Consumer,
   * QueueManagers, MessageManager, etc.) prior to calling this method to ensure all
   * in-flight operations complete and connections are released back to the pool.
   *
   * @param cb - Callback invoked when shutdown completes
   */
  static shutdown(cb: ICallback): void {
    const errors: Error[] = [];

    // 1) Shutdown all managed components to release pool connections
    RedisSMQ.shutdownComponents((compErr) => {
      if (compErr) errors.push(compErr);

      // 2) Shutdown the connection pool
      RedisConnectionPool.shutdown((poolErr) => {
        if (poolErr) errors.push(poolErr);

        // 3) Shutdown configuration client
        Configuration.shutdown((cfgErr) => {
          if (cfgErr) errors.push(cfgErr);

          // 4) Shutdown the event bus
          EventBus.shutdown((eventBusErr) => {
            if (eventBusErr) errors.push(eventBusErr);

            // 5) Reset initialized flag
            RedisSMQ.initialized = false;

            cb(errors[0] || null);
          });
        });
      });
    });
  }

  /**
   * Convenience method to create and start a producer in one call.
   *
   * @param cb - Callback function called when producer is ready
   * @returns The created Producer instance
   *
   * @example
   * ```typescript
   * const producer = RedisSMQ.startProducer((err) => {
   *   if (err) return console.error('Failed to start producer:', err);
   *   producer.produce(message, (produceErr, messageIds) => {
   *     if (produceErr) return console.error('Failed to produce:', produceErr);
   *     console.log('Message sent:', messageIds);
   *   });
   * });
   * ```
   */
  static startProducer(cb: ICallback<boolean>): Producer {
    const producer = RedisSMQ.createProducer();
    producer.run(cb);
    return producer;
  }

  /**
   * Convenience method to create and start a consumer in one call.
   *
   * @param enableMultiplexing - Optional flag to enable multiplexing
   * @param cb - Callback function called when consumer is ready
   * @returns The created Consumer instance
   *
   * @example
   * ```typescript
   * const consumer = RedisSMQ.startConsumer(false, (err) => {
   *   if (err) return console.error('Failed to start consumer:', err);
   *   consumer.consume('my-queue', (message, done) => {
   *     // handle message ...
   *     done();
   *   }, (consumeErr) => {
   *     if (consumeErr) return console.error('Failed to start consumption:', consumeErr);
   *     console.log('Consumer is consuming messages');
   *   });
   * });
   * ```
   */
  static startConsumer(
    enableMultiplexing: boolean,
    cb: ICallback<boolean>,
  ): Consumer;

  static startConsumer(cb: ICallback<boolean>): Consumer;

  static startConsumer(
    enableMultiplexingOrCb: boolean | ICallback<boolean>,
    cb?: ICallback<boolean>,
  ): Consumer {
    let enableMultiplexing: boolean = false;
    let callback: ICallback<boolean> = () => void 0;

    if (typeof enableMultiplexingOrCb === 'function') {
      callback = enableMultiplexingOrCb;
    } else if (
      typeof enableMultiplexingOrCb === 'boolean' &&
      typeof cb === 'function'
    ) {
      enableMultiplexing = enableMultiplexingOrCb;
      callback = cb;
    } else throw new Error('Invalid arguments');

    const consumer = RedisSMQ.createConsumer(enableMultiplexing);
    consumer.run(callback);
    return consumer;
  }

  // Track a created component that exposes a shutdown(cb) API
  private static trackComponent<T extends object>(instance: T): T {
    if (isDisposable(instance)) RedisSMQ.components.add(instance);
    return instance;
  }

  // Shutdown all tracked components
  private static shutdownComponents(cb: ICallback): void {
    const toShutdown = Array.from(RedisSMQ.components);
    if (toShutdown.length === 0) return cb();

    let pending = toShutdown.length;
    let firstErr: Error | null = null;

    toShutdown.forEach((comp) => {
      try {
        comp.shutdown((err) => {
          if (err && !firstErr) firstErr = err;
          RedisSMQ.components.delete(comp);
          if (--pending === 0) cb(firstErr || null);
        });
      } catch (e) {
        if (!firstErr && e instanceof Error) firstErr = e;
        RedisSMQ.components.delete(comp);
        if (--pending === 0) cb(firstErr || null);
      }
    });
  }

  private static bootstrap(
    redisConfig: IRedisConfig,
    configurationInit: (cb: ICallback) => void,
    cb: ICallback,
  ): void {
    async.series(
      [
        (cb: ICallback) =>
          RedisConnectionPool.initialize(redisConfig, {}, (err) => cb(err)),
        (cb: ICallback) => configurationInit(cb),
        (cb: ICallback) => {
          const config = Configuration.getConfig();
          if (config.eventBus.enabled) {
            return EventBus.getInstance().run((err) => cb(err));
          }
          cb();
        },
      ],
      (err) => {
        if (err) return cb(err);
        RedisSMQ.initialized = true;
        cb();
      },
    );
  }

  /**
   * Ensures RedisSMQ is initialized before use.
   * @throws Error if not initialized
   */
  private static ensureInitialized(): void {
    if (!RedisSMQ.initialized) {
      throw new Error(
        'RedisSMQ is not initialized. Call RedisSMQ.initialize() first.',
      );
    }
  }
}
