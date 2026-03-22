/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  CallbackEmptyReplyError,
  createLogger,
  Heartbeat,
  ICallback,
  IRedisClient,
  PanicError,
  Runnable,
} from 'redis-smq-common';
import { IHeartbeatPayload, TConsumerEvent } from '../common/index.js';
import { Configuration } from '../config/index.js';
import { _parseQueueExtendedParams } from '../queue-manager/_/_parse-queue-extended-params.js';
import {
  IQueueParsedParams,
  TQueueExtendedParams,
} from '../queue-manager/index.js';
import { MessageHandlerRunner } from './message-handler-runner/message-handler-runner.js';
import { MultiplexedMessageHandlerRunner } from './message-handler-runner/multiplexed-message-handler-runner.js';
import { eventPublisher } from './event-publisher.js';
import { TConsumerMessageHandler } from './message-handler/types/index.js';
import { IConsumerContext } from './types/consumer-context.js';
import { redisKeys } from '../common/redis/redis-keys/redis-keys.js';
import { HeartbeatFactory } from '../common/heartbeat/heartbeat.js';
import { heartbeatEventPublisher } from './heartbeat-event-publisher.js';
import {
  IConsumerOptions,
  IConsumerParsedOptions,
  IConsumerQueuesWithStatus,
} from './types/index.js';
import { _parseConsumerOptions } from './_/_parse-consumer-options.js';
import { RedisConnectionPool } from '../common/redis/redis-connection-pool/redis-connection-pool.js';
import { ERedisConnectionAcquisitionMode } from '../common/redis/redis-connection-pool/types/connection-pool.js';

/**
 * Consumer class responsible for receiving and processing messages from message queues.
 *
 * @example
 * ```typescript
 * const consumer = new Consumer();
 * consumer.run((err) => {
 *   if (err) {
 *     console.error('Failed to start consumer:', err);
 *     return;
 *   }
 *   console.log('Consumer is running');
 * });
 * ```
 */
export class Consumer extends Runnable<TConsumerEvent> {
  private static defaultOptions: IConsumerParsedOptions = {
    enableMultiplexing: false,
    heartbeatTTL: 60_000, // 1 min
    batchAcks: {
      enabled: true,
      batchSize: 100,
      batchTimeoutMs: 10_000,
    },
    batchUnacks: {
      enabled: true,
      batchSize: 100,
      batchTimeoutMs: 10_000,
    },
  };

  /** Internal context containing consumer configuration and dependencies */
  protected readonly consumerContext: IConsumerContext;

  /**
   * Instance responsible for running message handlers.
   * Can be either a multiplexed or standard message handler runner based on configuration.
   */
  protected messageHandlerRunner;

  /** Logger instance for consumer events and errors */
  protected logger;

  /**
   * Heartbeat instance for ensuring consumer remains alive and responsive.
   */
  protected heartbeat: Heartbeat<IHeartbeatPayload> | null = null;

  /** Parsed consumer configuration options */
  protected consumerOptions: IConsumerParsedOptions;

  /**
   *
   */
  protected redisClient: IRedisClient | null = null;

  /**
   * Creates a new Consumer instance with the specified options.
   *
   * @param {IConsumerOptions} [consumerOptions] - Configuration options for the consumer.
   *
   * The configuration object supports the following properties:
   *
   * - `enableMultiplexing` (boolean): When true, enables handling multiple queues with a single connection. Default: false.
   *
   * - `heartbeatTTL` (number): Consumer heartbeat TTL in milliseconds. Default: 60000 (1 minute).
   *
   * - `batchAcks` (boolean | IConsumerBatchConfig): Configuration for acknowledgment batching.
   *   - If `true`: Enables batch acknowledgments with default settings.
   *   - If `false`: Disables batch acknowledgments.
   *   - If object: Custom configuration with:
   *     - `enabled?`: boolean - Enable/disable (default: true)
   *     - `batchSize?`: number - Max messages per batch (default: 100)
   *     - `batchTimeoutMs?`: number - Max wait time in ms (default: 10000)
   *
   * - `batchUnacks` (boolean | IConsumerBatchConfig): Configuration for unacknowledgment batching.
   *   - If `true`: Enables batch unacknowledgments with default settings.
   *   - If `false`: Disables batch unacknowledgments.
   *   - If object: Same configuration options as `batchAcks`.
   *
   * @throws {Error} If RedisSMQ has not been initialized via `RedisSMQ.init()`.
   *
   * @example
   * ```typescript
   * // Create consumer with default settings
   * const consumer = new Consumer();
   *
   * // Enable multiplexing, keep other defaults
   * const consumer = new Consumer({
   *   enableMultiplexing: true
   * });
   *
   * // Custom heartbeat and disable acknowledgment batching
   * const consumer = new Consumer({
   *   heartbeatTTL: 60000,
   *   batchAcks: false
   * });
   *
   * // Custom batch configuration for unacknowledgments
   * const consumer = new Consumer({
   *   batchUnacks: {
   *     batchSize: 500,
   *     batchTimeoutMs: 5000
   *   }
   * });
   *
   * // Disable both types of batching
   * const consumer = new Consumer({
   *   batchAcks: false,
   *   batchUnacks: false
   * });
   *
   * // Full custom configuration
   * const consumer = new Consumer({
   *   enableMultiplexing: true,
   *   heartbeatTTL: 30000,
   *   batchAcks: {
   *     enabled: true,
   *     batchSize: 200,
   *     batchTimeoutMs: 2000
   *   },
   *   batchUnacks: {
   *     enabled: false  // Disable unack batching
   *   }
   * });
   * ```
   */
  constructor(consumerOptions?: IConsumerOptions) {
    super();
    this.consumerOptions = _parseConsumerOptions(
      consumerOptions,
      Consumer.defaultOptions,
    );
    const config = Configuration.getConfig();
    this.logger = createLogger(
      config.logger,
      `${this.constructor.name.toLowerCase()}-${this.id}`,
    );

    this.consumerContext = {
      consumerId: this.getId(),
      config: config,
      logger: this.logger,
      consumerOptions: this.consumerOptions,
    };

    eventPublisher(this);

    this.messageHandlerRunner = this.consumerOptions.enableMultiplexing
      ? new MultiplexedMessageHandlerRunner(this.consumerContext)
      : new MessageHandlerRunner(this.consumerContext);

    this.messageHandlerRunner.on(
      'consumer.messageHandlerRunner.error',
      (err) => {
        this.logger.error(`Message handler runner error: ${err.message}`);
        this.handleError(err);
      },
    );

    this.logger.info(
      `Consumer initialized${this.consumerOptions.enableMultiplexing ? ' with multiplexing enabled' : ''}`,
    );
  }

  protected initRedisClient = (cb: ICallback) => {
    RedisConnectionPool.getInstance().acquire(
      ERedisConnectionAcquisitionMode.SHARED,
      (err, client) => {
        if (err) return cb(err);
        if (!client) return cb(new CallbackEmptyReplyError());
        this.redisClient = client;
        cb();
      },
    );
  };

  protected releaseRedisClient = (cb: ICallback) => {
    if (this.redisClient) {
      RedisConnectionPool.getInstance().release(this.redisClient);
      this.redisClient = null;
    }
    cb();
  };

  /**
   * Sets up the consumer's heartbeat mechanism to monitor its health.
   *
   * @param {ICallback<void>} cb - Callback invoked when heartbeat setup completes or fails.
   */
  protected setUpHeartbeat = (cb: ICallback<void>): void => {
    if (!this.redisClient)
      return cb(
        new PanicError({
          message: 'Redis client is not initialized',
        }),
      );

    this.logger.debug('Setting up consumer heartbeat');
    const { keyConsumerHeartbeat } = redisKeys.getConsumerKeys(this.id);
    try {
      this.heartbeat = HeartbeatFactory(
        this.redisClient,
        this.logger,
        {
          heartbeatKey: keyConsumerHeartbeat,
          componentId: this.id,
          componentType: this.constructor.name,
          heartbeatTTL: this.consumerOptions.heartbeatTTL,
        },
        heartbeatEventPublisher,
      );
      this.heartbeat.on('heartbeat.error', (err) => {
        this.logger.error(`Heartbeat error: ${err.message}`);
        this.handleError(err);
      });
      this.logger.debug('Starting heartbeat');
      this.heartbeat.run((err) => {
        if (err) {
          this.logger.error(`Failed to start heartbeat: ${err.message}`);
          cb(err);
        } else {
          this.logger.debug('Heartbeat started successfully');
          cb();
        }
      });
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      cb(err);
    }
  };

  /**
   * Shuts down the consumer's heartbeat process.
   * Stops the heartbeat updates and cleans up resources.
   *
   * @param {ICallback<void>} cb - Callback invoked when heartbeat shutdown completes.
   */
  protected shutdownHeartbeat = (cb: ICallback<void>): void => {
    if (this.heartbeat) {
      this.logger.debug('Shutting down heartbeat');
      this.heartbeat.shutdown((err) => {
        if (err) {
          this.logger.warn(`Error during heartbeat shutdown: ${err.message}`);
        }
        this.logger.debug('Heartbeat shut down');
        this.heartbeat = null;
        cb();
      });
    } else {
      this.logger.debug('No heartbeat to shut down');
      cb();
    }
  };

  /**
   * Starts all registered message handlers.
   * This method initializes the message processing pipeline for all configured queues.
   *
   * @param {ICallback<void>} cb - Callback invoked when message handlers start or fail.
   */
  protected runMessageHandlers = (cb: ICallback<void>): void => {
    this.logger.debug('Starting message handlers');
    this.messageHandlerRunner.run((err) => {
      if (err) {
        this.logger.error(`Failed to start message handlers: ${err.message}`);
        cb(err);
      } else {
        this.logger.debug('Message handlers started successfully');
        cb();
      }
    });
  };

  /**
   * Shuts down all registered message handlers.
   * Stops message processing and cleans up resources.
   *
   * @param {ICallback<void>} cb - Callback invoked when message handlers shutdown completes.
   */
  protected shutdownMessageHandlers = (cb: ICallback<void>): void => {
    this.logger.debug('Shutting down message handlers');
    this.messageHandlerRunner.shutdown((err) => {
      if (err) {
        this.logger.warn(
          `Error during message handlers shutdown: ${err.message}`,
        );
      }
      this.logger.debug('Message handlers shut down');
      cb();
    });
  };

  /**
   * Defines the startup sequence for the consumer.
   *
   * @returns {Array<(cb: ICallback<void>) => void>} Array of functions to execute in sequence during startup.
   */
  protected override goingUp(): ((cb: ICallback<void>) => void)[] {
    return super.goingUp().concat([
      (cb) => {
        this.logger.debug(
          `Emitting consumer.goingUp event for consumer ${this.id}`,
        );
        this.emit('consumer.goingUp', this.id);
        cb();
      },
      this.initRedisClient,
      this.setUpHeartbeat,
      this.runMessageHandlers,
    ]);
  }

  /**
   * Defines the shutdown sequence for the consumer.
   *
   * @returns {Array<(cb: ICallback<void>) => void>} Array of functions to execute in sequence during shutdown.
   */
  protected override goingDown(): ((cb: ICallback<void>) => void)[] {
    this.emit('consumer.goingDown', this.id);
    return [
      this.shutdownMessageHandlers,
      this.shutdownHeartbeat,
      this.releaseRedisClient,
    ].concat(super.goingDown());
  }

  /**
   * Handles completion of the startup process.
   * Emits the 'consumer.up' event to indicate the consumer is fully operational.
   */
  protected override finalizeUp() {
    super.finalizeUp();
    this.emit('consumer.up', this.id);
  }

  /**
   * Handles completion of the shutdown process.
   * Emits the 'consumer.down' event to indicate the consumer has fully shut down.
   */
  protected override finalizeDown() {
    super.finalizeDown();
    this.emit('consumer.down', this.id);
  }

  /**
   * Handles errors encountered by the consumer.
   * Logs the error and emits the 'consumer.error' event with error details.
   */
  protected override handleError(err: Error) {
    if (!this.isOperational()) return;

    this.logger.error(`Consumer error: ${err.message}`, err);
    this.logger.debug(`Emitting consumer.error event for consumer ${this.id}`);
    this.emit('consumer.error', err, this.id);
    super.handleError(err);
  }

  /**
   * Configures the consumer to process messages from a specified queue.
   *
   * This method registers a message handler for the given queue. The handler function
   * will be called for each message received from the queue. Before consuming messages,
   * ensure the queue exists in the system.
   *
   * @param {TQueueExtendedParams} queue - Queue to consume messages from. Can be:
   *   - A string representing the queue name (uses default namespace)
   *   - An object with `{ ns: string, name: string }` for custom namespace
   *   - An object with `{ ns: string, name: string, groupId: string }` for consumer groups
   * @param {TConsumerMessageHandler} messageHandler - Function that processes each message.
   *   Receives the message and a `done` callback that must be called to acknowledge processing.
   * @param {ICallback<void>} cb - Callback invoked after consumption setup completes.
   *
   * @throws {InvalidQueueParametersError} When queue parameters are invalid.
   * @throws {MessageHandlerAlreadyExistsError} When a handler for this queue already exists.
   * @throws {ConsumerGroupsNotSupportedError} When consumer groups are not supported with the specified queue.
   * @throws {QueueNotFoundError} When the specified queue doesn't exist.
   * @throws {MessageHandlerFileError} When there are issues with message handler file.
   * @throws {MessageHandlerFilenameExtensionError} When message handler file has invalid extension.
   * @throws {QueuePausedError} When the queue is paused.
   * @throws {QueueStoppedError} When the queue is stopped.
   * @throws {QueueLockedError} When the queue is locked.
   * @throws {InvalidQueueStateError} When the queue is in an invalid state.
   * @throws {UnexpectedScriptReplyError} When Redis returns unexpected response.
   *
   * @example
   * ```typescript
   * // Consume from queue with default namespace
   * consumer.consume('my-queue', (message, done) => {
   *   console.log('Processing message:', message);
   *   // Process message...
   *   done(); // Acknowledge successful processing
   * }, (err) => {
   *   if (err) console.error('Failed to setup consumption:', err);
   * });
   *
   * // Consume from queue with custom namespace
   * consumer.consume(
   *   { ns: 'orders', name: 'incoming' },
   *   (message, done) => {
   *     // Process order...
   *     done();
   *   },
   *   (err) => {
   *     if (err) console.error('Failed to setup consumption:', err);
   *   }
   * );
   *
   * // Consume from consumer group
   * consumer.consume(
   *   { ns: 'chat', name: 'messages', groupId: 'group-1' },
   *   messageHandler,
   *   (err) => {
   *     if (err) console.error('Failed to setup consumption:', err);
   *   }
   * );
   * ```
   *
   * @see /packages/redis-smq/docs/consuming-messages.md
   */
  consume(
    queue: TQueueExtendedParams,
    messageHandler: TConsumerMessageHandler,
    cb: ICallback<void>,
  ): void {
    this.logger.info(
      `Setting up consumption for queue: ${typeof queue === 'string' ? queue : JSON.stringify(queue)}`,
    );
    const parsedQueueParams = _parseQueueExtendedParams(queue);
    if (parsedQueueParams instanceof Error) {
      this.logger.error(
        `Failed to parse queue parameters: ${parsedQueueParams.message}`,
      );
      cb(parsedQueueParams);
    } else {
      this.logger.debug(
        `Adding message handler for queue: ${JSON.stringify(parsedQueueParams)}`,
      );
      this.messageHandlerRunner.addMessageHandler(
        parsedQueueParams,
        messageHandler,
        (err) => {
          if (err) {
            this.logger.error(`Failed to add message handler: ${err.message}`);
            return cb(err);
          }
          this.logger.info(
            `Successfully set up consumption for queue: ${parsedQueueParams.queueParams.name}@${parsedQueueParams.queueParams.ns}${parsedQueueParams.groupId ? `, group: ${parsedQueueParams.groupId}` : ''}`,
          );
          cb();
        },
      );
    }
  }

  /**
   * Stops message consumption from a specified queue.
   *
   * This method removes the message handler associated with the given queue,
   * stopping any further message processing from that queue.
   *
   * @param {TQueueExtendedParams} queue - Queue to stop consuming from.
   *   Accepts the same formats as the `consume` method.
   * @param {ICallback<void>} cb - Callback invoked after cancellation completes.
   *
   * @throws {InvalidQueueParametersError} When queue parameters are invalid.
   * @throws {QueueNotFoundError} When the specified queue doesn't exist.
   *
   * @example
   * ```typescript
   * // Start consuming
   * consumer.consume('my-queue', messageHandler, (err) => {
   *   if (err) return console.error('Failed to setup consumption:', err);
   *
   *   // Cancel consumption after 10 seconds
   *   setTimeout(() => {
   *     consumer.cancel('my-queue', (err) => {
   *       if (err) {
   *         console.error('Error canceling consumption:', err);
   *       } else {
   *         console.log('Consumption cancelled successfully');
   *       }
   *     });
   *   }, 10000);
   * });
   *
   * // Cancel consumption from a consumer group
   * consumer.cancel(
   *   { ns: 'chat', name: 'messages', groupId: 'group-1' },
   *   (err) => {
   *     if (err) console.error('Failed to cancel:', err);
   *   }
   * );
   * ```
   */
  cancel(queue: TQueueExtendedParams, cb: ICallback<void>): void {
    this.logger.info(
      `Canceling consumption for queue: ${typeof queue === 'string' ? queue : JSON.stringify(queue)}`,
    );
    const parsedQueueParams = _parseQueueExtendedParams(queue);
    if (parsedQueueParams instanceof Error) {
      this.logger.error(
        `Failed to parse queue parameters: ${parsedQueueParams.message}`,
      );
      cb(parsedQueueParams);
    } else {
      this.logger.debug(
        `Removing message handler for queue: ${JSON.stringify(parsedQueueParams)}`,
      );
      this.messageHandlerRunner.removeMessageHandler(
        parsedQueueParams,
        (err) => {
          if (err) {
            this.logger.error(
              `Failed to remove message handler: ${err.message}`,
            );
            cb(err);
          } else {
            this.logger.info(
              `Successfully canceled consumption for queue: ${parsedQueueParams.queueParams.name} (namespace: ${parsedQueueParams.queueParams.ns}${parsedQueueParams.groupId ? `, group: ${parsedQueueParams.groupId}` : ''})`,
            );
            cb();
          }
        },
      );
    }
  }

  /**
   * Retrieves the list of queues the consumer is currently configured to handle.
   *
   * @returns {IQueueParsedParams[]} Array of parsed queue parameters for all queues
   *   currently being consumed. Each entry includes the queue name, namespace, and
   *   optional group ID.
   *
   * @example
   * ```typescript
   * consumer.consume('queue-1', handler1);
   * consumer.consume({ ns: 'custom', name: 'queue-2' }, handler2);
   *
   * const queues = consumer.getQueues();
   * console.log(queues);
   * // Output: [
   * //   { queueParams: { name: 'queue-1', ns: 'default' }, groupId: null },
   * //   { queueParams: { name: 'queue-2', ns: 'custom' }, groupId: null }
   * // ]
   * ```
   */
  getQueues(): IQueueParsedParams[] {
    this.logger.debug('Getting list of queues being consumed');
    const queues = this.messageHandlerRunner.getQueues();
    this.logger.debug(
      `Consumer is handling ${queues.length} queues: ${JSON.stringify(queues)}`,
    );
    return queues;
  }

  /**
   * Retrieves the list of queues the consumer is currently configured to handle,
   * along with their current consumption status.
   *
   * This method provides detailed information about each queue's consumption state,
   * including whether the queue is actively being processed or message consumption
   * is stopped. Upon stopping, pausing, or locking a queue, all queue consumers
   * immediately stop consuming messages from that queue. However, the queue
   * configuration remains registered in the consumer. When the queue is resumed,
   * message consumption automatically resumes without requiring the consumer to
   * reconfigure the queue. This is useful for monitoring and debugging consumer
   * behavior and queue state transitions.
   *
   * @returns {IConsumerQueuesWithStatus[]} Array of queue status objects, each containing:
   *   - Queue identification details (name, namespace, optional group ID)
   *   - Current consumption status (active, stopped)
   *
   * @example
   * ```typescript
   * consumer.consume({ ns: 'orders', name: 'pending' }, handler, callback);
   *
   * const queuesWithStatus = consumer.getQueuesWithStatus();
   * console.log(queuesWithStatus);
   * // Output: [
   * //   {
   * //       queue: {
   * //           queueParams: { ns: 'orders', name: 'pending' },
   * //           groupId: null,
   * //       },
   * //       status: 'active'
   * //   },
   * // ]
   *
   * // After queue is paused/stopped/locked, status changes but configuration persists
   * // When queue is resumed, status returns to 'active' and consumption continues
   * ```
   *
   * @see {@link getQueues} For retrieving queue information without status details.
   * @see {@link consume} For setting up queue consumption.
   * @see {@link cancel} For stopping queue consumption.
   */
  getQueuesWithStatus(): IConsumerQueuesWithStatus[] {
    this.logger.debug(
      'Getting list of queues being consumed with consumption status...',
    );
    const queues = this.messageHandlerRunner.getQueueWithStatus();
    this.logger.debug(
      `Consumer is handling ${queues.length} queues: ${JSON.stringify(queues)}`,
    );
    return queues;
  }

  /**
   * Sets default options for all future Consumer instances.
   * These options will be used when no options are provided to the constructor.
   *
   * @param {IConsumerOptions} options - Default consumer options to set.
   * @static
   *
   * @example
   * ```typescript
   * // Set global defaults
   * Consumer.setDefaultOptions({
   *   enableMultiplexing: true,
   *   heartbeatTTL: 60000,
   *   batchAcks: {
   *     batchSize: 500,
   *     batchTimeoutMs: 5000
   *   },
   *   batchUnacks: false
   * });
   *
   * // This consumer will use the defaults above
   * const consumer = new Consumer();
   * ```
   */
  static setDefaultOptions(options: IConsumerOptions): void {
    this.defaultOptions = _parseConsumerOptions(
      options,
      Consumer.defaultOptions,
    );
  }

  /**
   * Retrieves the current default options for Consumer instances.
   *
   * @returns {IConsumerParsedOptions} A copy of the current default options.
   *
   * @example
   * ```typescript
   * const defaults = Consumer.getDefaultOptions();
   * console.log(defaults);
   * // Output: {
   * //   enableMultiplexing: false,
   * //   heartbeatTTL: 120000,
   * //   batchAcks: { enabled: true, batchSize: 100, batchTimeoutMs: 10000 },
   * //   batchUnacks: { enabled: true, batchSize: 100, batchTimeoutMs: 10000 }
   * // }
   * ```
   */
  static getDefaultOptions(): IConsumerParsedOptions {
    return {
      ...this.defaultOptions,
    };
  }
}
