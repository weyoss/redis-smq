/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { async, ICallback, IRedisConfig } from 'redis-smq-common';
import { Configuration, IRedisSMQConfig } from './config/index.js';
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
import { RedisConnectionPool } from './common/index.js';
import { Disposable } from './common/types/disposable.js';
import { EventBus } from './event-bus/index.js';
import { parseRedisConfig } from './config/parse-redis-config.js';

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
   * Initializes RedisSMQ with Redis connection settings.
   * This is the simplest way to get started - just provide Redis connection once.
   *
   * @param redisConfig - Redis connection configuration
   * @param cb - Callback function called when initialization completes
   *
   * @example
   * ```typescript
   * import { RedisSMQ, ERedisConfigClient } from 'redis-smq';
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
   *   } else {
   *     console.log('RedisSMQ initialized successfully');
   *
   *     // Now you can create producers and consumers without Redis config!
   *     const producer = RedisSMQ.createProducer();
   *     const consumer = RedisSMQ.createConsumer();
   *   }
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
   * import { RedisSMQ, ERedisConfigClient } from 'redis-smq';
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
   *     enabled: true,
   *     options: { level: 'debug' }
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
   *   if (!err) {
   *     // Producer is ready to send messages
   *   }
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
   *   if (!err) {
   *     // Consumer is ready to receive messages
   *   }
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
   *   // Retrieved message by ID
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
   * const queueManager = RedisSMQ.createQueueManager();
   * queueManager.save('my-queue', EQueueType.LIFO_QUEUE, EQueueDeliveryModel.POINT_TO_POINT, (err, result) => {
   *   // Queue created
   * });
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
   *   // Retrieved namespaces
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
   *   // Message counts by status
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
   *   // Consumer group saved
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
   *   // Acknowledged message count
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
   *   // Dead lettered message count
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
   *   // Scheduled message count
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
   * pendingMessages.countMessages({ queue: 'my-queue' }, (err, count) => {
   *   // Pending message count
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
   * queueRateLimit.setQueueRateLimit('my-queue', { interval: 1000, limit: 10 }, (err) => {
   *   // Rate limit set
   * });
   * ```
   */
  static createQueueRateLimit(): QueueRateLimit {
    RedisSMQ.ensureInitialized();
    return RedisSMQ.trackComponent(new QueueRateLimit());
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
  static shutdown(cb: ICallback<void>): void {
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
   *   if (!err) {
   *     producer.produce(message, (err, messageIds) => {
   *       // Message sent
   *     });
   *   }
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
   *   if (!err) {
   *     consumer.consume('my-queue', messageHandler, (err) => {
   *       // Consumer is consuming messages
   *     });
   *   }
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
