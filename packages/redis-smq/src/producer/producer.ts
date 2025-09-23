/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
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
import { RedisConnectionPool, TProducerEvent } from '../common/index.js';
import { Configuration } from '../config/index.js';
import { _getExchangeQueues } from '../exchange/_/_get-exchange-queues.js';
import { EExchangeType } from '../exchange/index.js';
import { ProducibleMessage } from '../message/index.js';
import { MessageEnvelope } from '../message/message-envelope.js';
import { IQueueParams } from '../queue-manager/index.js';
import { _publishMessage } from './_/_publish-message.js';
import {
  NoMatchedQueueForExchangeError,
  ProducerNotRunningError,
  MessageExchangeRequiredError,
  QueueHasNoConsumerGroupsError,
  ProducerError,
} from '../errors/index.js';
import { eventBusPublisher } from './event-bus-publisher.js';
import { QueueConsumerGroupsCache } from './queue-consumer-groups-cache.js';
import { ERedisConnectionAcquisitionMode } from '../common/redis-connection-pool/types/index.js';

/**
 * The Producer class is responsible for producing messages, managing their
 * delivery to various queues, and ensuring that all components are ready
 * for operation.
 * The class provides methods for enqueuing messages, handling consumer groups,
 * and producing messages based on the message's exchange parameters.
 * Error handling is included throughout the methods, returning appropriate
 * error objects when necessary.
 */
export class Producer extends Runnable<TProducerEvent> {
  protected count = 0;
  protected logger; // Logger instance for logging activity
  protected queueConsumerGroupsHandler: QueueConsumerGroupsCache | null = null; // Handler for queue consumer groups
  protected redisClient: IRedisClient | null = null; // Redis client for communication with Redis

  /**
   * Constructor for the Producer class. Initializes the Redis client,
   * event bus, and logger. Sets up the event bus publisher if enabled.
   */
  constructor() {
    super();
    this.logger = createLogger(
      Configuration.getConfig().logger,
      this.constructor.name.toLowerCase(),
    );
    this.logger.info(`Producer instance created with ID: ${this.getId()}`);

    // If the event bus is enabled in configuration, initializes the event bus publisher.
    if (Configuration.getConfig().eventBus.enabled) {
      this.logger.debug(
        'Event bus is enabled, initializing eventBusPublisher...',
      );
      eventBusPublisher(this);
    } else {
      this.logger.debug(
        'Event bus is disabled, skipping eventBusPublisher initialization',
      );
    }
  }

  /**
   * Produces a message based on the provided parameters. Ensures that a valid
   * exchange is set and that at least one matching queue exists before
   * publishing the message.
   *
   * This method handles various errors, including:
   * - ProducerInstanceNotRunningError: Thrown when the producer instance is not running.
   * - ProducerMessageExchangeRequiredError: Thrown when no exchange is set for the message.
   * - ProducerExchangeNoMatchedQueueError: Thrown when no matching queues are found for the exchange.
   * - ProducerQueueNotFoundError: Thrown when a queue is not found.
   * - ProducerMessagePriorityRequiredError: Thrown when a message priority is required.
   * - ProducerPriorityQueuingNotEnabledError: Thrown when priority queuing is not enabled.
   * - ProducerUnknownQueueTypeError: Thrown when an unknown queue type is encountered.
   * - ProducerError: A generic error thrown when an unexpected error occurs.
   *
   * @param {ProducibleMessage} msg - The message to be produced and published.
   * @param {ICallback<string[]>} cb - A callback function to be executed upon completion.
   *                                   It receives an error as the first argument (if any)
   *                                   and an array of message IDs as the second argument.
   * @returns {void}
   */
  produce(msg: ProducibleMessage, cb: ICallback<string[]>): void {
    if (!this.isRunning()) {
      this.logger.error(
        'Cannot produce message: Producer instance is not running',
      );
      return cb(new ProducerNotRunningError());
    }

    const exchangeParams = msg.getExchange();
    if (!exchangeParams) {
      this.logger.error(
        'Cannot produce message: No exchange parameters provided',
      );
      return cb(new MessageExchangeRequiredError());
    }

    this.logger.debug(
      `Producing message with exchange type ${EExchangeType[exchangeParams.type]}`,
    );

    if (exchangeParams.type === EExchangeType.DIRECT) {
      const queue = exchangeParams.params;
      this.logger.debug(
        `Direct exchange: producing message for queue ${queue.name}@${queue.ns}`,
      );
      return this.produceMessage(msg, queue, cb);
    }

    this.logger.debug(
      `Fanout exchange: getting queues for exchange ${exchangeParams.type}`,
    );
    _getExchangeQueues(this.getRedisClient(), exchangeParams, (err, queues) => {
      if (err) {
        this.logger.error('Failed to get exchange queues', err);
        return cb(err);
      }

      if (!queues?.length) {
        this.logger.error('No matching queues found for exchange');
        return cb(new NoMatchedQueueForExchangeError());
      }

      this.logger.info(`Found ${queues.length} matching queues for exchange`);
      const messages: string[] = [];

      async.eachOf(
        queues,
        (queue, index, done) => {
          this.logger.debug(
            `Producing message for queue ${queue.name}@${queue.ns} (${index + 1}/${queues.length})`,
          );
          this.produceMessage(msg, queue, (err, reply) => {
            if (err) {
              this.logger.error(
                `Failed to produce message for queue ${queue.name}@${queue.ns}`,
                err,
              );
              return done(err);
            }
            if (reply) {
              this.logger.debug(
                `Successfully produced ${reply.length} messages for queue ${queue.name}@${queue.ns}`,
              );
              messages.push(...reply);
            }
            done();
          });
        },
        (err) => {
          if (err) {
            this.logger.error(
              'Failed to produce messages for some queues',
              err,
            );
            return cb(err);
          }
          this.logger.info(
            `Successfully produced ${messages.length} messages across ${queues.length} queues`,
          );
          cb(null, messages);
        },
      );
    });
  }

  /**
   * Retrieves the logger instance for this producer.
   * @returns {ILogger} The logger instance.
   */
  protected override getLogger(): ILogger {
    return this.logger;
  }

  protected getRedisClient(): IRedisClient {
    if (!this.redisClient)
      throw new ProducerError('Redis Client is not running');
    return this.redisClient;
  }

  /**
   * Initializes the queue consumer groups handler.
   * @param {ICallback<void>} cb - Callback to execute upon completion.
   */
  protected initQueueConsumerGroupsHandler = (cb: ICallback): void => {
    this.logger.debug('Initializing queue consumer groups handler');
    this.queueConsumerGroupsHandler = new QueueConsumerGroupsCache(this);
    this.queueConsumerGroupsHandler.run((err) => {
      if (err) {
        this.logger.error(
          'Failed to initialize queue consumer groups handler',
          err,
        );
      } else {
        this.logger.debug(
          'Queue consumer groups handler initialized successfully',
        );
      }
      cb(err);
    });
  };

  /**
   * Shuts down the queue consumer groups handler.
   * @param {ICallback<void>} cb - Callback to execute upon completion.
   */
  protected shutDownQueueConsumerGroupsHandler = (cb: ICallback): void => {
    if (this.queueConsumerGroupsHandler) {
      this.logger.debug('Shutting down queue consumer groups handler');
      this.queueConsumerGroupsHandler.shutdown(() => {
        this.logger.debug(
          'Queue consumer groups handler shut down successfully',
        );
        this.queueConsumerGroupsHandler = null;
        cb();
      });
    } else {
      this.logger.debug('No queue consumer groups handler to shut down');
      cb();
    }
  };

  /**
   * Defines the sequence of actions to take when the Producer is going up.
   * @returns {((cb: ICallback<void>) => void)[]} An array of functions to execute.
   */
  protected override goingUp(): ((cb: ICallback) => void)[] {
    this.logger.info(`Producer ${this.getId()} is starting up`);
    return super.goingUp().concat([
      (cb: ICallback): void => {
        async.withCallback(
          (cb) =>
            RedisConnectionPool.getInstance().acquire(
              ERedisConnectionAcquisitionMode.SHARED,
              cb,
            ),
          (redisClient: IRedisClient, cb: ICallback) => {
            this.redisClient = redisClient;
            cb();
          },
          (err) => cb(err),
        );
      },
      (cb: ICallback) => {
        this.logger.debug(
          `Emitting producer.goingUp event for producer ${this.id}`,
        );
        this.emit('producer.goingUp', this.id);
        cb();
      },
      this.initQueueConsumerGroupsHandler,
    ]);
  }

  /**
   * Handles actions when the producer is successfully brought 'up'.
   * @param {ICallback<boolean>} cb - Callback to execute upon completion.
   */
  protected override up(cb: ICallback<boolean>) {
    super.up(() => {
      this.logger.info(`Producer ${this.getId()} is now up and running`);
      this.emit('producer.up', this.id);
      cb(null, true);
    });
  }

  /**
   * Defines the sequence of actions to take when the Producer is shutting down.
   * This method is responsible for shutting down the producer instance and its associated components.
   * It ensures that the producer instance is properly closed and that any event bus instances are also shut down.
   *
   * @returns {((cb: ICallback<void>) => void)[]} An array of functions to execute.
   */
  protected override goingDown(): ((cb: ICallback) => void)[] {
    this.logger.info(`Producer ${this.getId()} is shutting down`);
    this.emit('producer.goingDown', this.id);
    return [
      this.shutDownQueueConsumerGroupsHandler,
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
   * Defines the sequence of actions to take when the producer is successfully brought 'down'.
   *
   * @param {ICallback<boolean>} cb - A callback function to be executed upon completion.
   *                                   It receives a boolean value as the first argument, indicating whether the shutdown process was successful.
   */
  protected override down(cb: ICallback<boolean>): void {
    super.down(() => {
      this.logger.info(`Producer ${this.getId()} is now down`);
      this.emit('producer.down', this.id);
      cb(null, true);
    });
  }

  /**
   * Retrieves the current instance of the QueueConsumerGroupsCache handler.
   *
   * This method ensures that the QueueConsumerGroupsCache handler is initialized
   * and returns its current instance. It is used to manage and access consumer
   * groups associated with queues.
   *
   * @returns {QueueConsumerGroupsCache} The current instance of the queue consumer groups handler.
   *
   * @throws {PanicError} If the handler instance is not initialized, indicating
   * that the handler is expected but not available.
   */
  protected getQueueConsumerGroupsHandler(): QueueConsumerGroupsCache {
    if (!this.queueConsumerGroupsHandler) {
      const error = new PanicError(
        `Expected an instance of QueueConsumerGroupsHandler`,
      );
      this.logger.error('Queue consumer groups handler not initialized', error);
      throw error;
    }
    return this.queueConsumerGroupsHandler;
  }

  protected produceMessageItem(
    message: MessageEnvelope,
    queue: IQueueParams,
    cb: ICallback<string>,
  ): void {
    const messageId = message
      .setDestinationQueue(queue)
      .getMessageState()
      .getId();

    const queueName = `${queue.name}@${queue.ns}`;
    this.logger.debug(
      `Producing message item ${messageId} for queue ${queueName}${
        message.isSchedulable() ? ' (scheduled)' : ''
      }`,
    );

    const handleResult: ICallback = (err) => {
      if (err) {
        this.logger.error(
          `Failed to produce message ${messageId} for queue ${queueName}`,
          err,
        );
        cb(err);
      } else {
        const action = message.isSchedulable() ? 'scheduled' : 'published';
        this.logger.info(
          `Message (ID ${messageId}) has been ${action} to queue ${queueName}`,
        );
        if (!message.isSchedulable()) {
          this.logger.debug(
            `Emitting messagePublished event for message ${messageId}`,
          );
          this.emit(
            'producer.messagePublished',
            messageId,
            { queueParams: queue, groupId: message.getConsumerGroupId() },
            this.id,
          );
        }
        cb(null, messageId);
      }
    };

    const ts = Date.now();
    if (message.isSchedulable()) {
      this.logger.debug(`Scheduling message ${messageId} for future delivery`);
      message
        .getMessageState()
        .setScheduledAt(ts)
        .setLastScheduledAt(ts)
        .incrScheduledTimes();
    } else {
      this.logger.debug(
        `Enqueueing message ${messageId} for immediate delivery`,
      );
      message.getMessageState().setPublishedAt(ts);
    }
    _publishMessage(this.getRedisClient(), message, this.logger, handleResult);
  }

  /**
   * Produces messages for the specified queue and handles multiple consumer
   * groups if applicable. It checks if the queue exists and has consumer groups,
   * then produces the message for each group. If no consumer groups are found,
   * it returns an error. Otherwise, it produces the message for the queue.
   *
   * @param message - The message to produce.
   * @param queue - Queue parameters.
   * @param cb - Callback to execute upon completion. It receives an error as the first argument (if any)
   *             and an array of message IDs as the second argument.
   */
  protected produceMessage(
    message: ProducibleMessage,
    queue: IQueueParams,
    cb: ICallback<string[]>,
  ): void {
    const queueName = `${queue.name}@${queue.ns}`;
    this.logger.debug(`Producing message for queue ${queueName}`);

    const { exists, consumerGroups } =
      this.getQueueConsumerGroupsHandler().getConsumerGroups(queue);

    if (exists) {
      this.logger.debug(
        `Queue ${queueName} exists with ${consumerGroups.length} consumer groups`,
      );

      if (!consumerGroups.length) {
        this.logger.error(`Queue ${queueName} has no consumer groups`);
        cb(new QueueHasNoConsumerGroupsError());
        return;
      }

      const ids: string[] = [];
      this.logger.debug(
        `Producing message for ${consumerGroups.length} consumer groups in queue ${queueName}`,
      );

      async.eachOf(
        consumerGroups,
        (group, _, done) => {
          this.logger.debug(
            `Producing message for consumer group ${group} in queue ${queueName}`,
          );
          const msg = new MessageEnvelope(message).setConsumerGroupId(group);
          this.produceMessageItem(msg, queue, (err, reply) => {
            if (err) {
              this.logger.error(
                `Failed to produce message for consumer group ${group}`,
                err,
              );
              done(err);
            } else {
              this.logger.debug(
                `Successfully produced message ${reply} for consumer group ${group}`,
              );
              ids.push(String(reply));
              done();
            }
          });
        },
        (err) => {
          if (err) {
            this.logger.error(
              `Failed to produce messages for some consumer groups in queue ${queueName}`,
              err,
            );
            cb(err);
          } else {
            this.logger.info(
              `Successfully produced ${ids.length} messages for queue ${queueName}`,
            );
            cb(null, ids);
          }
        },
      );
    } else {
      this.logger.debug(
        `Queue ${queueName} has no consumer groups, producing message directly`,
      );
      const msg = new MessageEnvelope(message);
      this.produceMessageItem(msg, queue, (err, reply) => {
        if (err) {
          this.logger.error(
            `Failed to produce message for queue ${queueName}`,
            err,
          );
          cb(err);
        } else {
          this.logger.info(
            `Successfully produced message ${reply} for queue ${queueName}`,
          );
          cb(null, [String(reply)]);
        }
      });
    }
  }
}
