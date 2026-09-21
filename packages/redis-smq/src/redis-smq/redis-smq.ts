/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback, PanicError } from 'redis-smq-common';
import { StateManager } from './state-manager.js';
import { ComponentRegistry } from './component-registry.js';
import { LifecycleManager } from './lifecycle-manager.js';

// ── Concrete implementations ──────────────────────────────────────────────
import { Consumer } from '../core/consumer/consumer.js';
import { Producer } from '../core/producer/producer.js';
import { MessageManager } from '../core/message-manager/index.js';
import { QueueManager } from '../core/queue-manager/index.js';
import { QueueStateManager } from '../core/queue-state-manager/index.js';
import { NamespaceManager } from '../core/namespace-manager/index.js';
import { ConfigManager } from '../core/config-manager/index.js';
import { ConsumerGroupsManager } from '../core/consumer-groups/index.js';
import { QueueRateLimitManager } from '../core/queue-rate-limit-manager/index.js';
import {
  QueueAcknowledgedMessages,
  QueueDeadLetteredMessages,
  QueuePendingMessages,
  QueuePublishedMessages,
  QueueScheduledMessages,
} from '../core/queue-messages/index.js';
import {
  ExchangeDirect,
  ExchangeFanout,
  ExchangeManager,
  ExchangeTopic,
} from '../core/exchange/index.js';

// ── Public contracts ──────────────────────────────────────────────────────
import {
  IConfigManager,
  IConsumer,
  IConsumerGroupsManager,
  IConsumerOptions,
  IEventBus,
  IExchangeDirect,
  IExchangeFanout,
  IExchangeManager,
  IExchangeTopic,
  IMessageManager,
  INamespaceManager,
  IProducer,
  IProducibleMessage,
  IQueueAcknowledgedMessages,
  IQueueDeadLetteredMessages,
  IQueueManager,
  IQueueOperationValidatorStatic,
  IQueuePendingMessages,
  IQueuePublishedMessages,
  IQueueRateLimitManager,
  IQueueScheduledMessages,
  IQueueStateManager,
  TMessageConsumeOptions,
} from '../contracts/index.js';
import { ProducibleMessage } from '../core/message/index.js';
import { EventBus } from '../core/event-bus/index.js';
import { QueueOperationValidator } from '../core/queue-operation-validator/index.js';

/**
 * The composition-root step that every `create*` method performs.
 *
 * Three things, in order:
 *
 *   1. Verifies RedisSMQ is initialized. Construction before
 *      `initialize()` would produce a component with no Redis connection
 *      and no configuration; failing fast here is the caller's signal.
 *
 *   2. Constructs the concrete implementation.
 *
 *   3. Registers the instance with `ComponentRegistry` so that
 *      `RedisSMQ.shutdown()` tears it down alongside the rest of the
 *      library's resources.
 *
 * @throws PanicError if RedisSMQ is not currently running. The check is
 *   a synchronous state read with no allocation beyond the error object
 *   on the failure path.
 */
function build<T extends object>(factory: () => T): T {
  if (!StateManager.isRunning()) {
    throw new PanicError({
      message: 'RedisSMQ is not initialized. Call RedisSMQ.initialize() first.',
    });
  }
  return ComponentRegistry.track(factory());
}

/**
 * The main RedisSMQ facade.
 *
 * Every method is static. The class is never instantiated — it exists to
 * expose the library's public surface in one place: the two lifecycle
 * methods that bring the underlying machinery up and down, and a set of
 * `create*` / `start*` methods that construct the library's runtime
 * components.
 *
 * ---
 *
 * ### Lifecycle
 *
 * `initialize()` must be called once before any `create*` or `start*`
 * method. Calling a constructor method on an uninitialized library
 * throws `PanicError`.
 *
 * `shutdown()` tears down every component that was created during the
 * current lifecycle, plus the connection pool, configuration, and event
 * buses. A caller who wants to use the library again calls
 * `initialize()` again; the state machine permits this because every
 * shutdown leaves the state at `DOWN` with an empty component registry.
 *
 * ---
 *
 * ### Composition
 *
 * Each `create*` method constructs a concrete class from `core/`,
 * registers it for teardown, and returns it typed as its contract
 * interface. The concrete class is not part of the public API — a
 * caller who inspects the return value sees `IConsumer`, not
 * `Consumer`. Every concrete class implements its contract, so the
 * compiler verifies that the shape the caller sees matches the shape
 * the library promised.
 *
 * The `build` helper above performs the initialization check, the
 * construction, and the registration. The three steps are identical
 * for every component; only the constructor differs.
 *
 * ---
 *
 * ### Return types
 *
 * Every method returns an interface from `contracts/`. This is what
 * makes the concrete classes replaceable without breaking callers: as
 * long as a new implementation satisfies the interface, the facade can
 * return it.
 *
 * ---
 *
 * ### Example
 *
 * ```ts
 * import { RedisSMQ, ProducibleMessage } from 'redis-smq';
 *
 * // One-time initialization
 * await RedisSMQ.initialize({
 *   client: ERedisConfigClient.IOREDIS,
 *   options: { host: '127.0.0.1', port: 6379 },
 * });
 *
 * // Create a producer and publish a message
 * const producer = await RedisSMQ.startProducer();
 * const msg = new ProducibleMessage()
 *   .setQueue({ name: 'orders', ns: 'default' })
 *   .setBody({ orderId: 123 });
 * await producer.produce(msg);
 *
 * // Create a consumer and subscribe a handler
 * const consumer = await RedisSMQ.startConsumer();
 * await consumer.consume('orders', async (m) => {
 *   console.log(m.getBody());
 * });
 *
 * // Tear everything down at process exit
 * await RedisSMQ.shutdown();
 * ```
 */
export class RedisSMQ {
  // ═══════════════════════════════════════════════════════════════════════
  // Lifecycle
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Initializes RedisSMQ.
   *
   * Must be called once before any other method. Brings up the
   * connection pool, loads the configuration (from Redis, or saves the
   * defaults if none exists), starts both event buses, starts the
   * configuration sync mechanism, and starts the background-job
   * cluster.
   *
   * Concurrency:
   *   - A call while RedisSMQ is already running resolves immediately.
   *   - A call while initialization is in flight queues the caller; the
   *     callback fires once the in-flight initialization settles.
   *   - A call during shutdown fails with `PanicError`. The caller
   *     should wait for shutdown to complete, then initialize again.
   *
   * On failure, every resource acquired during the attempt is released
   * and the state machine returns to `DOWN`. A subsequent call can
   * retry from a clean slate.
   *
   * @param redisConfig - Optional Redis connection configuration.
   *   When omitted, the library uses connection defaults
   *   (localhost:6379, database 0).
   */
  static initialize = LifecycleManager.initialize;

  /**
   * Gracefully shuts down RedisSMQ.
   *
   * Stops the background-job cluster, tears down every component
   * produced by the `create*` methods, stops the configuration sync,
   * stops both event buses, and closes the connection pool. The state
   * machine returns to `DOWN`.
   *
   * Idempotent:
   *   - A call while the library is already down resolves immediately.
   *   - A call while a shutdown is in flight queues the caller; the
   *     callback fires once the in-flight shutdown completes.
   *   - A call while initialization is in flight fails with
   *     `PanicError`.
   */
  static shutdown = LifecycleManager.shutdown;

  /**
   * Returns whether RedisSMQ is currently running.
   *
   * True between the completion of a successful `initialize()` and the
   * beginning of `shutdown()`. False during startup, during shutdown,
   * and after shutdown.
   */
  static isRunning = LifecycleManager.isRunning;

  // ═══════════════════════════════════════════════════════════════════════
  // Producers
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Creates a new producer.
   *
   * The returned producer is not started. Call `run()` on it before
   * publishing, or use `startProducer()` to combine creation and
   * startup.
   *
   * @throws PanicError if RedisSMQ is not initialized.
   */
  static createProducer(): IProducer {
    return build(() => new Producer());
  }

  /**
   * Creates a new producer and starts it in one call.
   *
   * The promise overload resolves with the producer once it is up; the
   * callback overload returns the producer synchronously and fires the
   * callback when startup completes or fails. A caller who receives the
   * producer from the callback overload must not publish until the
   * callback has fired — the producer rejects with
   * `ProducerNotRunningError` until its `run()` sequence has completed.
   */
  static startProducer(): Promise<IProducer>;
  static startProducer(cb: ICallback): IProducer;
  static startProducer(cb?: ICallback): Promise<IProducer> | IProducer {
    const producer = RedisSMQ.createProducer();
    if (cb) {
      producer.run((err) => {
        if (err) return cb(err);
        cb(null);
      });
      return producer;
    }
    return producer.run().then(() => producer);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Consumers
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Creates a new consumer.
   *
   * The returned consumer is not started. Call `run()` on it before
   * consuming, or use `startConsumer()` to combine creation and
   * startup.
   *
   * @param consumerOptions - Optional consumer configuration.
   * @throws PanicError if RedisSMQ is not initialized.
   */
  static createConsumer(consumerOptions?: IConsumerOptions): IConsumer {
    return build(() => new Consumer(consumerOptions));
  }

  /**
   * Creates a new consumer and starts it in one call.
   *
   * Same two-mode contract as `startProducer`. The consumer is started
   * before any handlers are registered; a consumer with no handlers is
   * valid and waits for `consume()` calls.
   */
  static startConsumer(consumerOptions?: IConsumerOptions): Promise<IConsumer>;
  static startConsumer(
    consumerOptions: IConsumerOptions,
    cb: ICallback,
  ): IConsumer;
  static startConsumer(
    consumerOptions?: IConsumerOptions,
    cb?: ICallback,
  ): Promise<IConsumer> | IConsumer {
    const consumer = RedisSMQ.createConsumer(consumerOptions);
    if (cb) {
      consumer.run((err) => {
        if (err) return cb(err);
        cb(null);
      });
      return consumer;
    }
    return consumer.run().then(() => consumer);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ProducibleMessage
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Creates a ProducibleMessage instance.
   */
  static newProducibleMessage(): IProducibleMessage {
    return new ProducibleMessage();
  }

  // ═══════════════════════════════════════════════════════════════════════
  // EventBus
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Retrieve the EventBus instance.
   */
  static getEventBus(): IEventBus {
    return EventBus.getInstance();
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Managers
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Creates a queue manager.
   * @throws PanicError if RedisSMQ is not initialized.
   */
  static createQueueManager(): IQueueManager {
    return build(() => new QueueManager());
  }

  /**
   * Creates a queue state manager.
   * @throws PanicError if RedisSMQ is not initialized.
   */
  static createQueueStateManager(): IQueueStateManager {
    return build(() => new QueueStateManager());
  }

  /**
   * Creates a message manager.
   * @throws PanicError if RedisSMQ is not initialized.
   */
  static createMessageManager(): IMessageManager {
    return build(() => new MessageManager());
  }

  /**
   * Creates a namespace manager.
   * @throws PanicError if RedisSMQ is not initialized.
   */
  static createNamespaceManager(): INamespaceManager {
    return build(() => new NamespaceManager());
  }

  /**
   * Creates a configuration manager.
   * @throws PanicError if RedisSMQ is not initialized.
   */
  static createConfigManager(): IConfigManager {
    return build(() => new ConfigManager());
  }

  /**
   * Creates a consumer-groups manager.
   * @throws PanicError if RedisSMQ is not initialized.
   */
  static createConsumerGroupsManager(): IConsumerGroupsManager {
    return build(() => new ConsumerGroupsManager());
  }

  /**
   * Creates a queue rate-limit manager.
   * @throws PanicError if RedisSMQ is not initialized.
   */
  static createQueueRateLimitManager(): IQueueRateLimitManager {
    return build(() => new QueueRateLimitManager());
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Message browsers
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Creates a browser for a queue's published messages.
   * @throws PanicError if RedisSMQ is not initialized.
   */
  static createQueuePublishedMessages(): IQueuePublishedMessages {
    return build(() => new QueuePublishedMessages());
  }

  /**
   * Creates a browser for a queue's pending messages.
   * @throws PanicError if RedisSMQ is not initialized.
   */
  static createQueuePendingMessages(): IQueuePendingMessages {
    return build(() => new QueuePendingMessages());
  }

  /**
   * Creates a browser for a queue's scheduled messages.
   * @throws PanicError if RedisSMQ is not initialized.
   */
  static createQueueScheduledMessages(): IQueueScheduledMessages {
    return build(() => new QueueScheduledMessages());
  }

  /**
   * Creates a browser for a queue's acknowledged messages.
   *
   * Requires the `messageAudit.acknowledgedMessages` audit to be
   * enabled; every method on the browser raises
   * `AcknowledgmentAuditDisabledError` when it is not.
   *
   * @throws PanicError if RedisSMQ is not initialized.
   */
  static createQueueAcknowledgedMessages(): IQueueAcknowledgedMessages {
    return build(() => new QueueAcknowledgedMessages());
  }

  /**
   * Creates a browser for a queue's dead-lettered messages.
   *
   * Requires the `messageAudit.deadLetteredMessages` audit to be
   * enabled; every method on the browser raises
   * `DeadLetterAuditDisabledError` when it is not.
   *
   * @throws PanicError if RedisSMQ is not initialized.
   */
  static createQueueDeadLetteredMessages(): IQueueDeadLetteredMessages {
    return build(() => new QueueDeadLetteredMessages());
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Exchanges
  // ═══════════════════════════════════════════════════════════════════════

  // ═══════════════════════════════════════════════════════════════════════
  // Exchanges
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Creates an exchange manager.
   *
   * The manager is the entry point for callers who carry the exchange
   * type as a runtime value: it exposes every exchange operation
   * (create, delete, bindQueue, unbindQueue, matchQueues, getBindings,
   * plus the type-specific reads and the registry-wide discovery
   * methods) on a single object. `createDirectExchange()`,
   * `createTopicExchange()`, and `createFanoutExchange()` return
   * type-specific facades that delegate to a manager of their own; a
   * caller who knows the type at the call site uses those.
   *
   * Unlike the three facades, the manager exposes the discovery
   * methods — `getAllExchanges()`, `getNamespaceExchanges()`, and
   * `getQueueExchanges()` — because those describe the global exchange
   * registry rather than a single exchange.
   *
   * @throws PanicError if RedisSMQ is not initialized.
   */
  static createExchangeManager(): IExchangeManager {
    return build(() => new ExchangeManager());
  }

  /**
   * Creates a direct exchange.
   * @throws PanicError if RedisSMQ is not initialized.
   */
  static createDirectExchange(): IExchangeDirect {
    return build(() => new ExchangeDirect());
  }

  /**
   * Creates a topic exchange.
   * @throws PanicError if RedisSMQ is not initialized.
   */
  static createTopicExchange(): IExchangeTopic {
    return build(() => new ExchangeTopic());
  }

  /**
   * Creates a fanout exchange.
   * @throws PanicError if RedisSMQ is not initialized.
   */
  static createFanoutExchange(): IExchangeFanout {
    return build(() => new ExchangeFanout());
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Helpers
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Returns QueueOperationValidator class
   * @throws PanicError if RedisSMQ is not initialized.
   */
  static createQueueOperationValidator(): IQueueOperationValidatorStatic {
    return build(() => QueueOperationValidator);
  }

  /**
   * Sets default options for all future Consumer instances.
   *
   * @param options - Default consumer options
   *
   * @example
   * RedisSMQ.setDefaultConsumerOptions({
   *   enableMultiplexing: true,
   *   heartbeatTTL: 60000
   * });
   */
  static setDefaultConsumerOptions(options: IConsumerOptions): void {
    Consumer.setDefaultOptions(options);
  }

  /**
   * Gets current default options for Consumer instances.
   *
   * @returns Copy of default options
   *
   * @example
   * const defaults = RedisSMQ.getDefaultConsumerOptions();
   * console.log(defaults);
   */
  static getDefaultConsumerOptions(): IConsumerOptions {
    return Consumer.getDefaultOptions();
  }

  /**
   * Sets default consume options for all future ProducibleMessage instances.
   *
   * @param options - Partial options to override defaults
   *
   * @example
   * setDefaultConsumerOptions.setDefaultMessageConsumeOptions({
   *   ttl: 60000,
   *   retryThreshold: 5,
   *   retryDelay: 30000
   * });
   */
  static setDefaultMessageConsumeOptions(
    options: Partial<TMessageConsumeOptions>,
  ): void {
    ProducibleMessage.setDefaultConsumeOptions(options);
  }

  /**
   * Gets current default options for Consumer instances.
   *
   * @returns Copy of default options
   *
   * @example
   * const defaults = Consumer.getDefaultOptions();
   * console.log(defaults);
   */
  static getDefaultMessageConsumeOptions(): TMessageConsumeOptions {
    return ProducibleMessage.getDefaultConsumeOptions();
  }
}
