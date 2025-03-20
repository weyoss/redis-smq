/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  CallbackEmptyReplyError,
  ICallback,
  ILogger,
  logger,
  Runnable,
  TRedisClientEvent,
  TUnaryFunction,
} from 'redis-smq-common';
import { TConsumerEvent } from '../../../common/index.js';
import { RedisClient } from '../../../common/redis-client/redis-client.js';
import { Configuration } from '../../../config/index.js';
import { EventBus } from '../../event-bus/index.js';
import { _parseQueueExtendedParams } from '../../queue/_/_parse-queue-extended-params.js';
import { IQueueParsedParams, TQueueExtendedParams } from '../../queue/index.js';
import { ConsumerHeartbeat } from '../consumer-heartbeat/consumer-heartbeat.js';
import { MessageHandlerRunner } from '../message-handler-runner/message-handler-runner.js';
import { MultiplexedMessageHandlerRunner } from '../message-handler-runner/multiplexed-message-handler-runner.js';
import { TConsumerMessageHandler } from '../types/index.js';
import { eventBusPublisher } from './event-bus-publisher.js';

/**
 * Consumer class responsible for receiving and processing messages from a message queue.
 * It implements the `Runnable` interface to handle lifecycle events like startup and shutdown.
 * The Consumer can be configured for multiplexing, allowing it to handle multiple queues simultaneously with a single Redis connection.
 *
 * @extends Runnable<TConsumerEvent>
 */
export class Consumer extends Runnable<TConsumerEvent> {
  // Instance responsible for running message handlers. It can be either a multiplexed or a standard message handler runner.
  protected messageHandlerRunner;

  // Logger instance for logging events and errors.
  protected logger;

  // Redis client instance for interacting with Redis.
  protected redisClient;

  // Event bus instance used for publishing/subscribing events, if enabled in the configuration.
  protected eventBus: EventBus | null = null;

  // Heartbeat instance for ensuring the consumer remains alive and responsive.
  protected heartbeat: ConsumerHeartbeat | null = null;

  /**
   * Creates a new Consumer instance.
   *
   * @param {boolean} [enableMultiplexing] -  (Optional) If set to true, the consumer uses a multiplexed message handler runner; otherwise, it uses a standard message handler runner.
   */
  constructor(enableMultiplexing?: boolean) {
    super();
    // Initialize configuration and components
    const config = Configuration.getSetConfig();
    this.logger = logger.getLogger(
      config.logger,
      `consumer:${this.id}:message-handler`,
    );
    this.redisClient = new RedisClient();
    this.redisClient.on('error', this.onRedisError);

    if (Configuration.getSetConfig().eventBus.enabled) {
      this.eventBus = new EventBus();
      this.eventBus.on('error', this.onRedisError);
      eventBusPublisher(this, this.eventBus, this.logger);
    }
    this.messageHandlerRunner = enableMultiplexing
      ? new MultiplexedMessageHandlerRunner(
          this,
          this.redisClient,
          this.logger,
          this.eventBus,
        )
      : new MessageHandlerRunner(
          this,
          this.redisClient,
          this.logger,
          this.eventBus,
        );

    this.messageHandlerRunner.on('consumer.messageHandlerRunner.error', (err) =>
      this.handleError(err),
    );
  }

  /**
   * Error handler for Redis client errors.
   *
   * @param {Error} error - The error encountered.
   */
  protected onRedisError: TRedisClientEvent['error'] = (error) => {
    this.handleError(error);
  };

  /**
   * Sets up the consumer's heartbeat to monitor its health.
   *
   * @param {ICallback<void>} cb - Callback function to be called once setup is complete.
   */
  protected setUpHeartbeat = (cb: ICallback<void>): void => {
    this.heartbeat = new ConsumerHeartbeat(
      this,
      this.redisClient,
      this.logger,
      this.eventBus ?? null,
    );
    this.heartbeat.on('consumerHeartbeat.error', (err) =>
      this.handleError(err),
    );
    this.heartbeat.run((err) => cb(err));
  };

  /**
   * Shuts down the heartbeat process.
   *
   * @param {ICallback<void>} cb - Callback function to be called once shutdown is complete.
   */
  protected shutDownHeartbeat = (cb: ICallback<void>): void => {
    if (this.heartbeat) {
      this.heartbeat.shutdown(() => {
        this.heartbeat = null;
        cb();
      });
    } else cb();
  };

  /**
   * Runs all message handlers.
   *
   * @param {ICallback<void>} cb - Callback function to be called once processing is complete.
   */
  protected runMessageHandlers = (cb: ICallback<void>): void => {
    this.messageHandlerRunner.run((err) => cb(err));
  };

  /**
   * Shuts down the message handlers.
   *
   * @param {ICallback<void>} cb - Callback function to be called once shutdown is complete.
   */
  protected shutdownMessageHandlers = (cb: ICallback<void>): void => {
    this.messageHandlerRunner.shutdown(() => cb());
  };

  /**
   * Initializes the Redis client instance.
   *
   * @param {ICallback<void>} cb - Callback function to be called once initialization is complete.
   */
  protected initRedisClient = (cb: ICallback<void>): void => {
    this.redisClient.getSetInstance((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new CallbackEmptyReplyError());
      else {
        client.on('error', this.onRedisError);
        cb();
      }
    });
  };

  /**
   * Shuts down the Redis client instance.
   *
   * @param {ICallback<void>} cb - Callback function to be called once shutdown is complete.
   */
  protected shutDownRedisClient = (cb: ICallback<void>): void => {
    this.redisClient.shutdown(() => cb());
  };

  /**
   * Defines the startup sequence for the consumer.
   *
   * @returns {TUnaryFunction<ICallback<void>>[]} - Array of functions to be executed in sequence during startup.
   */
  protected override goingUp(): TUnaryFunction<ICallback<void>>[] {
    return super.goingUp().concat([
      (cb) => {
        if (this.eventBus) this.eventBus.init(cb);
        else cb();
      },
      (cb) => {
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
   * @returns {TUnaryFunction<ICallback<void>>[]} - Array of functions to be executed in sequence during shutdown.
   */
  protected override goingDown(): TUnaryFunction<ICallback<void>>[] {
    this.emit('consumer.goingDown', this.id);
    return [
      this.shutdownMessageHandlers,
      this.shutDownHeartbeat,
      this.shutDownRedisClient,
    ].concat(super.goingDown());
  }

  /**
   * Handles the successful up process of the consumer.
   *
   * @param {ICallback<boolean>} cb - Callback function to indicate success.
   */
  protected override up(cb: ICallback<boolean>) {
    super.up(() => {
      this.emit('consumer.up', this.id);
      cb(null, true);
    });
  }

  /**
   * Handles the successful down process of the consumer.
   *
   * @param {ICallback<boolean>} cb - Callback function to indicate success.
   */
  protected override down(cb: ICallback<boolean>) {
    super.down(() => {
      this.emit('consumer.down', this.id);
      // Delay the shutdown of the event bus
      setTimeout(() => {
        if (this.eventBus) {
          this.eventBus.shutdown(() => cb(null, true));
        } else cb(null, true);
      }, 1000);
    });
  }

  /**
   * Gets the logger instance for the consumer.
   * @returns {ILogger} - The logger instance.
   */
  protected override getLogger(): ILogger {
    return this.logger;
  }

  /**
   * Handles errors encountered by the consumer.
   * @param {Error} err - The error to handle.
   */
  protected override handleError(err: Error) {
    this.emit('consumer.error', err, this.id);
    super.handleError(err);
  }

  /**
   * Consumes messages from a specified queue using the provided message handler.
   *
   * @param {TQueueExtendedParams} queue - A queue from which messages will be consumed. Before consuming
   * messages from a queue make sure that the specified queue already exists in
   * the system.
   * @param {TConsumerMessageHandler} messageHandler - A callback function that defines how to process each
   * message consumed from the queue. The messageHandler will receive the
   * message as an argument and should implement the logic for processing the
   * message. This might include business logic, transformation, storage, etc.
   * It's crucial that this function handles exceptions and errors properly to
   * avoid issues with message acknowledgment.
   * @param {ICallback<void>} cb - The callback function will be executed after the consumption process is initiated.
   * It typically signifies the end of the consumption setup and can be used to
   * handle success or errors in starting the consumption process.
   *
   * @example
   * ```typescript
   * const consumer = new Consumer();
   * consumer.consume(
   *   'my-queue',
   *   (message, done) => {
   *     // Handle the message
   *     // ...
   *     // Acknowledge the message
   *     done();
   *   },
   *   (err) => {
   *     if (err) {
   *       console.error('Error consuming messages:', err);
   *     } else {
   *       console.log('Consumption set up successfully');
   *     }
   *   },
   * );
   * ```
   *
   * @see https://github.com/weyoss/redis-smq/blob/master/docs/consuming-messages.md
   */
  consume(
    queue: TQueueExtendedParams,
    messageHandler: TConsumerMessageHandler,
    cb: ICallback<void>,
  ): void {
    const parsedQueueParams = _parseQueueExtendedParams(queue);
    if (parsedQueueParams instanceof Error) cb(parsedQueueParams);
    else {
      this.messageHandlerRunner.addMessageHandler(
        parsedQueueParams,
        messageHandler,
        cb,
      );
    }
  }

  /**
   * Cancels the consumption of messages from a specified queue.
   *
   * This function is responsible for stopping the consumption of messages from a specific queue.
   * It removes the message handler associated with the given queue from the message handler runner.
   *
   * @param {TQueueExtendedParams} queue - The queue parameters.
   * This parameter represents the queue from which messages will be consumed.
   * It can be a string representing the queue name or an object containing additional queue options.
   *
   * @param {ICallback<void>} cb - Callback function to be called once cancellation is complete.
   * This callback function will be invoked after the message handler associated with the given queue is removed.
   * If an error occurs during the cancellation process, the error will be passed as the first argument to the callback function.
   * Otherwise, the callback function will be invoked with no arguments.
   *
   * @example
   * ```typescript
   * const consumer = new Consumer();
   * consumer.consume(
   *   'my-queue',
   *   (message, done) => {
   *     // Handle the message
   *     // ...
   *     // Acknowledge the message
   *     done();
   *   },
   *   (err) => {
   *     if (err) {
   *       console.error('Error consuming messages:', err);
   *     } else {
   *       console.log('Consumption set up successfully');
   *     }
   *   },
   * );
   *
   * // Cancel consumption after some time
   * setTimeout(() => {
   *   consumer.cancel('my-queue', (err) => {
   *     if (err) {
   *       console.error('Error canceling consumption:', err);
   *     } else {
   *       console.log('Consumption cancelled successfully');
   *     }
   *   });
   * }, 10000);
   * ```
   */
  cancel(queue: TQueueExtendedParams, cb: ICallback<void>): void {
    const parsedQueueParams = _parseQueueExtendedParams(queue);
    if (parsedQueueParams instanceof Error) cb(parsedQueueParams);
    else {
      this.messageHandlerRunner.removeMessageHandler(parsedQueueParams, cb);
    }
  }

  /**
   * Retrieves a list of queues the consumer is currently configured to handle.
   *
   * This function returns an array of parsed queue parameters that the consumer is currently set up to handle.
   * The parsed queue parameters include the queue name, options, and any additional parameters specified.
   *
   * @returns {IQueueParsedParams[]} - An array of parsed queue parameters.
   * Each element in the array represents a queue that the consumer is currently consuming messages from.
   *
   * @example
   * ```typescript
   * const consumer = new Consumer();
   * consumer.consume(
   *   'my-queue',
   *   (message, done) => {
   *     // Handle the message
   *     // ...
   *     // Acknowledge the message
   *     done();
   *   },
   *   (err) => {
   *     if (err) {
   *       console.error('Error consuming messages:', err);
   *     } else {
   *       console.log('Consumption set up successfully');
   *     }
   *   },
   * );
   *
   * // Get the list of queues the consumer is handling
   * const queues = consumer.getQueues();
   * console.log('Queues:', queues);
   * // Output: Queues: [{ queueParams: { name:'my-queue', ns: 'default' }, groupId: null }]
   * ```
   */
  getQueues(): IQueueParsedParams[] {
    return this.messageHandlerRunner.getQueues();
  }
}
