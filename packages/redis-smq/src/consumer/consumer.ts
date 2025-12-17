/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { createLogger, ICallback, ILogger, Runnable } from 'redis-smq-common';
import { TConsumerEvent } from '../common/index.js';
import { Configuration } from '../config/index.js';
import { _parseQueueExtendedParams } from '../queue-manager/_/_parse-queue-extended-params.js';
import {
  IQueueParsedParams,
  TQueueExtendedParams,
} from '../queue-manager/index.js';
import { ConsumerHeartbeat } from './consumer-heartbeat/consumer-heartbeat.js';
import { MessageHandlerRunner } from './message-handler-runner/message-handler-runner.js';
import { MultiplexedMessageHandlerRunner } from './message-handler-runner/multiplexed-message-handler-runner.js';
import { eventBusPublisher } from './event-bus-publisher/event-bus-publisher.js';
import { TConsumerMessageHandler } from './message-handler/types/index.js';
import { IConsumerContext } from './types/consumer-context.js';

/**
 * Consumer class responsible for receiving and processing messages from a message queue.
 * It implements the `Runnable` interface to handle lifecycle events like startup and shutdown.
 * The Consumer can be configured for multiplexing, allowing it to handle multiple queues simultaneously with a single Redis connection.
 *
 * @extends Runnable<TConsumerEvent>
 */
export class Consumer extends Runnable<TConsumerEvent> {
  protected readonly consumerContext: IConsumerContext;

  // Instance responsible for running message handlers. It can be either a multiplexed or a standard message handler runner.
  protected messageHandlerRunner;

  // Logger instance for logging events and errors.
  protected logger;

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
    const config = Configuration.getConfig();
    this.logger = createLogger(
      config.logger,
      `${this.constructor.name.toLowerCase()}-${this.id}`,
    );

    //
    this.consumerContext = {
      consumerId: this.getId(),
      config: config,
      logger: this.logger,
    };

    this.logger.info(
      `Initializing consumer${enableMultiplexing ? ' with multiplexing enabled' : ''}`,
    );

    if (config.eventBus.enabled) {
      this.logger.debug(
        'Event bus is enabled, initializing eventBusPublisher...',
      );
      eventBusPublisher(this);
      this.logger.debug('Event bus publisher configured');
    } else {
      this.logger.debug('Event bus is disabled');
    }

    this.logger.debug(
      `Creating ${enableMultiplexing ? 'multiplexed' : 'standard'} message handler runner`,
    );
    this.messageHandlerRunner = enableMultiplexing
      ? new MultiplexedMessageHandlerRunner(this.consumerContext)
      : new MessageHandlerRunner(this.consumerContext);

    this.messageHandlerRunner.on(
      'consumer.messageHandlerRunner.error',
      (err) => {
        this.logger.error(`Message handler runner error: ${err.message}`);
        this.handleError(err);
      },
    );

    this.logger.info(`Consumer initialized with ID: ${this.id}`);
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
            `Successfully set up consumption for queue: ${parsedQueueParams.queueParams.name} (namespace: ${parsedQueueParams.queueParams.ns}${parsedQueueParams.groupId ? `, group: ${parsedQueueParams.groupId}` : ''})`,
          );
          cb();
        },
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
    this.logger.debug('Getting list of queues being consumed');
    const queues = this.messageHandlerRunner.getQueues();
    this.logger.debug(
      `Consumer is handling ${queues.length} queues: ${JSON.stringify(queues)}`,
    );
    return queues;
  }

  /**
   * Sets up the consumer's heartbeat to monitor its health.
   *
   * @param {ICallback<void>} cb - Callback function to be called once setup is complete.
   */
  protected setUpHeartbeat = (cb: ICallback<void>): void => {
    this.logger.debug('Setting up consumer heartbeat');
    this.heartbeat = new ConsumerHeartbeat(this.consumerContext);
    this.heartbeat.on('consumerHeartbeat.error', (err) => {
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
  };

  /**
   * Shuts down the heartbeat process.
   *
   * @param {ICallback<void>} cb - Callback function to be called once shutdown is complete.
   */
  protected shutDownHeartbeat = (cb: ICallback<void>): void => {
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
   * Runs all message handlers.
   *
   * @param {ICallback<void>} cb - Callback function to be called once processing is complete.
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
   * Shuts down the message handlers.
   *
   * @param {ICallback<void>} cb - Callback function to be called once shutdown is complete.
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
   * @returns {((cb: ICallback<void>) => void)[]} - Array of functions to be executed in sequence during startup.
   */
  protected override goingUp(): ((cb: ICallback<void>) => void)[] {
    this.logger.info('Consumer going up');
    return super.goingUp().concat([
      (cb) => {
        this.logger.debug(
          `Emitting consumer.goingUp event for consumer ${this.id}`,
        );
        this.emit('consumer.goingUp', this.id);
        cb();
      },
      this.setUpHeartbeat,
      this.runMessageHandlers,
    ]);
  }

  /**
   * Defines the shutdown sequence for the consumer.
   *
   * @returns {((cb: ICallback<void>) => void)[]} - Array of functions to be executed in sequence during shutdown.
   */
  protected override goingDown(): ((cb: ICallback<void>) => void)[] {
    this.logger.info('Consumer going down');
    this.logger.debug(
      `Emitting consumer.goingDown event for consumer ${this.id}`,
    );
    this.emit('consumer.goingDown', this.id);
    return [this.shutdownMessageHandlers, this.shutDownHeartbeat].concat(
      super.goingDown(),
    );
  }

  /**
   * Handles the successful up process of the consumer.
   *
   * @param {ICallback<boolean>} cb - Callback function to indicate success.
   */
  protected override up(cb: ICallback<boolean>) {
    this.logger.info('Consumer is up');
    super.up(() => {
      this.logger.debug(`Emitting consumer.up event for consumer ${this.id}`);
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
    this.logger.info(`Consumer ${this.getId()} is now down`);
    super.down(() => {
      this.logger.debug(`Emitting consumer.down event for consumer ${this.id}`);
      this.emit('consumer.down', this.id);
      cb(null, true);
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
    this.logger.error(`Consumer error: ${err.message}`, err);
    this.logger.debug(`Emitting consumer.error event for consumer ${this.id}`);
    this.emit('consumer.error', err, this.id);
    super.handleError(err);
  }
}
