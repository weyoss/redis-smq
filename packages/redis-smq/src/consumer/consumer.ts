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
  CallbackEmptyReplyError,
  createLogger,
  Heartbeat,
  ICallback,
  IRedisClient,
  PanicError,
  Runnable,
} from 'redis-smq-common';
import { Configuration } from '../config-manager/configuration.js';
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
import {
  IConsumerOptions,
  IConsumerParsedOptions,
  IConsumerQueuesWithStatus,
} from './types/index.js';
import { _parseConsumerOptions } from './_/_parse-consumer-options.js';
import { RedisConnectionPool } from '../common/redis/redis-connection-pool/redis-connection-pool.js';
import { ERedisConnectionAcquisitionMode } from '../common/redis/redis-connection-pool/types/connection-pool.js';
import { TConsumerEvent } from '../event-bus/index.js';

/**
 * Consumer for processing messages from queues.
 *
 * Manages message handlers, heartbeats, and consumption lifecycle.
 * Supports multiplexing for multiple queues and batch acknowledgments.
 *
 * @example
 * const consumer = new Consumer();
 * await consumer.run();
 *
 * // Callback-style handler
 * await consumer.consume('orders', (message, done) => {
 *   console.log(message.getBody());
 *   done();
 * });
 *
 * // Promise-style handler
 * await consumer.consume('orders', async (message) => {
 *   await processMessage(message);
 * });
 */
export class Consumer extends Runnable<TConsumerEvent> {
  private static defaultOptions: IConsumerParsedOptions = {
    enableMultiplexing: false,
    heartbeatTTL: 60_000,
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

  protected readonly consumerContext: IConsumerContext;
  protected messageHandlerRunner;
  protected logger;
  protected heartbeat: Heartbeat | null = null;
  protected consumerOptions: IConsumerParsedOptions;
  protected redisClient: IRedisClient | null = null;

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
      this.heartbeat = new Heartbeat(this.redisClient, this.logger, {
        heartbeatKey: keyConsumerHeartbeat,
        componentId: this.id,
        componentType: this.constructor.name,
        heartbeatTTL: this.consumerOptions.heartbeatTTL,
      });
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

  protected override goingDown(): ((cb: ICallback<void>) => void)[] {
    this.emit('consumer.goingDown', this.id);
    return [
      this.shutdownMessageHandlers,
      this.shutdownHeartbeat,
      this.releaseRedisClient,
    ].concat(super.goingDown());
  }

  protected override finalizeUp() {
    super.finalizeUp();
    this.emit('consumer.up', this.id);
  }

  protected override finalizeDown() {
    super.finalizeDown();
    this.emit('consumer.down', this.id);
  }

  protected override handleError(err: Error) {
    if (!this.isOperational()) return;

    this.logger.error(`Consumer error: ${err.message}`, err);
    this.logger.debug(`Emitting consumer.error event for consumer ${this.id}`);
    this.emit('consumer.error', err, this.id);
    super.handleError(err);
  }

  /**
   * Registers a message handler for a queue.
   *
   * The handler can be either:
   * - A callback function: `(message, done) => void`
   * - A promise function: `async (message) => Promise<void>`
   * - A string path to a module exporting a handler
   *
   * @param queue - Queue identifier: string name, IQueueParams, or IQueueParsedParams
   * @param messageHandler - Handler function or module path
   * @param cb - (err) => void
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * // Callback handler
   * await consumer.consume('orders', (message, done) => {
   *   console.log(message.getBody());
   *   done();
   * });
   *
   * // Promise handler
   * await consumer.consume('orders', async (message) => {
   *   await processMessage(message);
   * });
   *
   * // Module path handler
   * await consumer.consume('orders', './handlers/order-handler.js');
   *
   * // Callback
   * consumer.consume('orders', (message, done) => {
   *   done();
   * }, (err) => {
   *   if (err) throw err;
   * });
   */
  consume(
    queue: TQueueExtendedParams,
    messageHandler: TConsumerMessageHandler,
  ): Promise<void>;
  consume(
    queue: TQueueExtendedParams,
    messageHandler: TConsumerMessageHandler,
    cb: ICallback<void>,
  ): void;
  consume(
    queue: TQueueExtendedParams,
    messageHandler: TConsumerMessageHandler,
    cb?: ICallback<void>,
  ): Promise<void> | void {
    return async.withOptionalCallback(cb, (callback) => {
      this.logger.info(
        `Setting up consumption for queue: ${typeof queue === 'string' ? queue : JSON.stringify(queue)}`,
      );
      const parsedQueueParams = _parseQueueExtendedParams(queue);
      if (parsedQueueParams instanceof Error) {
        this.logger.error(
          `Failed to parse queue parameters: ${parsedQueueParams.message}`,
        );
        callback(parsedQueueParams);
      } else {
        this.logger.debug(
          `Adding message handler for queue: ${JSON.stringify(parsedQueueParams)}`,
        );
        this.messageHandlerRunner.addMessageHandler(
          parsedQueueParams,
          messageHandler,
          (err) => {
            if (err) {
              this.logger.error(
                `Failed to add message handler: ${err.message}`,
              );
              return callback(err);
            }
            this.logger.info(
              `Successfully set up consumption for queue: ${parsedQueueParams.queueParams.name}@${parsedQueueParams.queueParams.ns}${parsedQueueParams.groupId ? `, group: ${parsedQueueParams.groupId}` : ''}`,
            );
            callback();
          },
        );
      }
    });
  }

  /**
   * Stops message consumption from a queue.
   *
   * @param queue - Queue name (string) or { name, ns } or { name, ns, groupId }
   * @param cb - (err) => void
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * // Promise
   * await consumer.cancel('orders');
   *
   * // Callback
   * consumer.cancel('orders', (err) => {
   *   if (err) throw err;
   * });
   */
  cancel(queue: TQueueExtendedParams): Promise<void>;
  cancel(queue: TQueueExtendedParams, cb: ICallback<void>): void;
  cancel(
    queue: TQueueExtendedParams,
    cb?: ICallback<void>,
  ): Promise<void> | void {
    return async.withOptionalCallback(cb, (callback) => {
      this.logger.info(
        `Canceling consumption for queue: ${typeof queue === 'string' ? queue : JSON.stringify(queue)}`,
      );

      const parsedQueueParams = _parseQueueExtendedParams(queue);
      if (parsedQueueParams instanceof Error) {
        this.logger.error(
          `Failed to parse queue parameters: ${parsedQueueParams.message}`,
        );
        callback(parsedQueueParams);
        return;
      }

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
            callback(err);
          } else {
            this.logger.info(
              `Successfully canceled consumption for queue: ${parsedQueueParams.queueParams.name}@${parsedQueueParams.queueParams.ns}${parsedQueueParams.groupId ? `, group: ${parsedQueueParams.groupId}` : ''}`,
            );
            callback();
          }
        },
      );
    });
  }

  /**
   * Gets all queues the consumer is handling.
   *
   * @returns Array of queue parameters
   *
   * @example
   * const queues = consumer.getQueues();
   * console.log(queues);
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
   * Gets all queues with their consumption status.
   *
   * @returns Array of queue objects with status ('active' or 'stopped')
   *
   * @example
   * const queues = consumer.getQueuesWithStatus();
   * console.log(queues[0].status);
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
   *
   * @param options - Default consumer options
   *
   * @example
   * Consumer.setDefaultOptions({
   *   enableMultiplexing: true,
   *   heartbeatTTL: 60000
   * });
   */
  static setDefaultOptions(options: IConsumerOptions): void {
    this.defaultOptions = _parseConsumerOptions(
      options,
      Consumer.defaultOptions,
    );
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
  static getDefaultOptions(): IConsumerParsedOptions {
    return {
      ...this.defaultOptions,
    };
  }
}
