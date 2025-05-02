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
  ICallback,
  ILogger,
  IRedisClient,
  logger,
  PanicError,
  Runnable,
} from 'redis-smq-common';
import { TProducerEvent } from '../../common/index.js';
import { RedisClient } from '../../common/redis-client/redis-client.js';
import { ELuaScriptName } from '../../common/redis-client/scripts/scripts.js';
import { redisKeys } from '../../common/redis-keys/redis-keys.js';
import { Configuration } from '../../config/index.js';
import { EventBus } from '../../common/index.js';
import { _getExchangeQueues } from '../exchange/_/_get-exchange-queues.js';
import { EExchangeType } from '../exchange/index.js';
import {
  EMessageProperty,
  EMessagePropertyStatus,
  ProducibleMessage,
} from '../message/index.js';
import { MessageEnvelope } from '../message/message-envelope.js';
import { EQueueProperty, EQueueType, IQueueParams } from '../queue/index.js';
import { _scheduleMessage } from './_/_schedule-message.js';
import {
  ProducerError,
  ProducerExchangeNoMatchedQueueError,
  ProducerInstanceNotRunningError,
  ProducerMessageExchangeRequiredError,
  ProducerMessagePriorityRequiredError,
  ProducerPriorityQueuingNotEnabledError,
  ProducerQueueMissingConsumerGroupsError,
  ProducerQueueNotFoundError,
  ProducerUnknownQueueTypeError,
} from './errors/index.js';
import { eventBusPublisher } from './event-bus-publisher.js';
import { QueueConsumerGroupsCache } from './queue-consumer-groups-cache.js';

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
  protected logger; // Logger instance for logging activity
  protected redisClient; // Redis client for communication with Redis
  protected eventBus; // Event bus instance for event-driven communication
  protected queueConsumerGroupsHandler: QueueConsumerGroupsCache | null = null; // Handler for queue consumer groups

  /**
   * Constructor for the Producer class. Initializes the Redis client,
   * event bus, and logger. Sets up the event bus publisher if enabled.
   */
  constructor() {
    super();
    // Initializes the Redis client and event bus with error handling.
    this.redisClient = new RedisClient();
    this.redisClient.on('error', (err) => this.handleError(err));
    this.eventBus = new EventBus();
    this.eventBus.on('error', (err) => this.handleError(err));
    this.logger = logger.getLogger(
      Configuration.getSetConfig().logger,
      this.constructor.name.toLowerCase(),
    );
    this.logger.info(`Producer instance created with ID: ${this.getId()}`);

    // If the event bus is enabled in configuration, initializes the event bus publisher.
    if (Configuration.getSetConfig().eventBus.enabled) {
      this.logger.debug(
        'Event bus is enabled, initializing event bus publisher',
      );
      eventBusPublisher(this, this.eventBus, this.logger);
    } else {
      this.logger.debug(
        'Event bus is disabled, skipping event bus publisher initialization',
      );
    }
  }

  /**
   * Retrieves the logger instance for this producer.
   * @returns {ILogger} The logger instance.
   */
  protected override getLogger(): ILogger {
    return this.logger;
  }

  /**
   * Initializes the queue consumer groups handler.
   * @param {ICallback<void>} cb - Callback to execute upon completion.
   */
  protected initQueueConsumerGroupsHandler = (cb: ICallback<void>): void => {
    this.logger.debug('Initializing queue consumer groups handler');
    this.queueConsumerGroupsHandler = new QueueConsumerGroupsCache(
      this,
      this.redisClient,
      this.eventBus,
    );
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
  protected shutDownQueueConsumerGroupsHandler = (
    cb: ICallback<void>,
  ): void => {
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
  protected override goingUp(): ((cb: ICallback<void>) => void)[] {
    this.logger.info(`Producer ${this.getId()} is starting up`);
    return super.goingUp().concat([
      this.redisClient.init,
      this.eventBus.init,
      (cb: ICallback<void>) => {
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
  protected override goingDown(): ((cb: ICallback<void>) => void)[] {
    this.logger.info(`Producer ${this.getId()} is shutting down`);
    this.emit('producer.goingDown', this.id);
    return [
      this.shutDownQueueConsumerGroupsHandler,
      this.redisClient.shutdown,
    ].concat(super.goingDown());
  }

  /**
   * Defines the sequence of actions to take when the producer is successfully brought 'down'.
   * This method is responsible for shutting down the producer instance and its associated components.
   * It ensures that the producer instance is properly closed and that any event bus instances are also shut down.
   *
   * @param {ICallback<boolean>} cb - A callback function to be executed upon completion.
   *                                   It receives a boolean value as the first argument, indicating whether the shutdown process was successful.
   */
  protected override down(cb: ICallback<boolean>): void {
    super.down(() => {
      this.logger.info(`Producer ${this.getId()} is now down`);
      this.emit('producer.down', this.id);
      this.logger.debug('Shutting down event bus with 1 second delay');
      setTimeout(() => {
        this.eventBus.shutdown(() => {
          this.logger.debug('Event bus shut down successfully');
          cb(null, true);
        });
      }, 1000);
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

  /**
   * Enqueues a message onto the specified queue in Redis.
   *
   * This function is responsible for placing a message into a queue, setting its state,
   * and handling any errors that may occur during the process. It uses a Redis client
   * to execute a Lua script that manages the message's placement in the queue.
   *
   * @param redisClient - The Redis client used for communication with the Redis server.
   * @param message - The message to be enqueued, wrapped in a MessageEnvelope.
   * @param cb - A callback function to be executed upon completion. It receives an error
   *             as the first argument (if any) and void as the second argument.
   */
  protected enqueue(
    redisClient: IRedisClient,
    message: MessageEnvelope,
    cb: ICallback<void>,
  ): void {
    const messageState = message.getMessageState();
    messageState.setPublishedAt(Date.now());
    const messageId = message.getId();
    const destinationQueue = message.getDestinationQueue();
    const queueName = `${destinationQueue.name}@${destinationQueue.ns}`;
    const consumerGroupId = message.getConsumerGroupId();

    this.logger.debug(
      `Enqueuing message ${messageId} to queue ${queueName}${consumerGroupId ? ` for consumer group ${consumerGroupId}` : ''}`,
    );

    const keys = redisKeys.getQueueKeys(destinationQueue, consumerGroupId);
    const { keyMessage } = redisKeys.getMessageKeys(messageId);
    const priority = message.producibleMessage.getPriority();

    this.logger.debug(
      `Message ${messageId} details: priority=${priority ?? 'none'}, queue=${queueName}`,
    );

    const scriptArgs = [
      EQueueProperty.QUEUE_TYPE,
      EQueueProperty.MESSAGES_COUNT,
      EQueueType.PRIORITY_QUEUE,
      EQueueType.LIFO_QUEUE,
      EQueueType.FIFO_QUEUE,
      priority ?? '',
      messageId,
      EMessageProperty.STATUS,
      EMessagePropertyStatus.PENDING,
      EMessageProperty.STATE,
      JSON.stringify(messageState),
      EMessageProperty.MESSAGE,
      JSON.stringify(message.toJSON()),
    ];

    redisClient.runScript(
      ELuaScriptName.PUBLISH_MESSAGE,
      [
        keys.keyQueueProperties,
        keys.keyQueuePriorityPending,
        keys.keyQueuePending,
        keys.keyQueueMessages,
        keyMessage,
      ],
      scriptArgs,
      (err, reply) => {
        if (err) {
          this.logger.error(`Failed to enqueue message ${messageId}`, err);
          return cb(err);
        }

        switch (reply) {
          case 'OK':
            this.logger.debug(
              `Successfully enqueued message ${messageId} to queue ${queueName}`,
            );
            return cb();
          case 'QUEUE_NOT_FOUND':
            this.logger.error(
              `Queue ${queueName} not found for message ${messageId}`,
            );
            return cb(new ProducerQueueNotFoundError());
          case 'MESSAGE_PRIORITY_REQUIRED':
            this.logger.error(
              `Priority required for message ${messageId} but not provided`,
            );
            return cb(new ProducerMessagePriorityRequiredError());
          case 'PRIORITY_QUEUING_NOT_ENABLED':
            this.logger.error(
              `Priority queuing not enabled for queue ${queueName}`,
            );
            return cb(new ProducerPriorityQueuingNotEnabledError());
          case 'UNKNOWN_QUEUE_TYPE':
            this.logger.error(`Unknown queue type for queue ${queueName}`);
            return cb(new ProducerUnknownQueueTypeError());
          default:
            this.logger.error(
              `Unknown error while enqueuing message ${messageId}: ${reply}`,
            );
            return cb(new ProducerError());
        }
      },
    );
  }

  protected produceMessageItem(
    redisClient: IRedisClient,
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

    const handleResult: ICallback<void> = (err) => {
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

    if (message.isSchedulable()) {
      this.logger.debug(`Scheduling message ${messageId} for future delivery`);
      _scheduleMessage(redisClient, message, handleResult);
    } else {
      this.logger.debug(
        `Enqueueing message ${messageId} for immediate delivery`,
      );
      this.enqueue(redisClient, message, handleResult);
    }
  }

  /**
   * Produces messages for the specified queue and handles multiple consumer
   * groups if applicable. It checks if the queue exists and has consumer groups,
   * then produces the message for each group. If no consumer groups are found,
   * it returns an error. Otherwise, it produces the message for the queue.
   *
   * @param redisClient - The Redis client used for communication.
   * @param message - The message to produce.
   * @param queue - Queue parameters.
   * @param cb - Callback to execute upon completion. It receives an error as the first argument (if any)
   *             and an array of message IDs as the second argument.
   */
  protected produceMessage(
    redisClient: IRedisClient,
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
        cb(new ProducerQueueMissingConsumerGroupsError());
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
          this.produceMessageItem(redisClient, msg, queue, (err, reply) => {
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
      this.produceMessageItem(redisClient, msg, queue, (err, reply) => {
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
    if (!this.isUp()) {
      this.logger.error(
        'Cannot produce message: Producer instance is not running',
      );
      return cb(new ProducerInstanceNotRunningError());
    }

    const exchangeParams = msg.getExchange();
    if (!exchangeParams) {
      this.logger.error(
        'Cannot produce message: No exchange parameters provided',
      );
      return cb(new ProducerMessageExchangeRequiredError());
    }

    this.logger.debug(
      `Producing message with exchange type ${EExchangeType[exchangeParams.type]}`,
    );

    const redisClient = this.redisClient.getInstance();
    if (redisClient instanceof Error) {
      this.logger.error(
        'Cannot produce message: Redis client error',
        redisClient,
      );
      return cb(redisClient);
    }

    if (exchangeParams.type === EExchangeType.DIRECT) {
      const queue = exchangeParams.params;
      this.logger.debug(
        `Direct exchange: producing message for queue ${queue.name}@${queue.ns}`,
      );
      return this.produceMessage(redisClient, msg, queue, cb);
    }

    this.logger.debug(
      `Fanout exchange: getting queues for exchange ${exchangeParams.type}`,
    );
    _getExchangeQueues(redisClient, exchangeParams, (err, queues) => {
      if (err) {
        this.logger.error('Failed to get exchange queues', err);
        return cb(err);
      }

      if (!queues?.length) {
        this.logger.error('No matching queues found for exchange');
        return cb(new ProducerExchangeNoMatchedQueueError());
      }

      this.logger.info(`Found ${queues.length} matching queues for exchange`);
      const messages: string[] = [];

      async.eachOf(
        queues,
        (queue, index, done) => {
          this.logger.debug(
            `Producing message for queue ${queue.name}@${queue.ns} (${index + 1}/${queues.length})`,
          );
          this.produceMessage(redisClient, msg, queue, (err, reply) => {
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
}
