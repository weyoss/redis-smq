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
  CallbackEmptyReplyError,
  ICallback,
  ILogger,
  IRedisClient,
  logger,
  PanicError,
  Runnable,
  TUnaryFunction,
} from 'redis-smq-common';
import { TProducerEvent } from '../../common/index.js';
import { RedisClient } from '../../common/redis-client/redis-client.js';
import { ELuaScriptName } from '../../common/redis-client/scripts/scripts.js';
import { redisKeys } from '../../common/redis-keys/redis-keys.js';
import { Configuration } from '../../config/index.js';
import { EventBus } from '../event-bus/index.js';
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
      `producer:${this.id}`,
    );

    // If the event bus is enabled in configuration, initializes the event bus publisher.
    if (Configuration.getSetConfig().eventBus.enabled) {
      eventBusPublisher(this, this.eventBus, this.logger);
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
    this.queueConsumerGroupsHandler = new QueueConsumerGroupsCache(
      this,
      this.redisClient,
      this.eventBus,
      this.logger,
    );
    this.queueConsumerGroupsHandler.run((err) => cb(err));
  };

  /**
   * Shuts down the queue consumer groups handler.
   * @param {ICallback<void>} cb - Callback to execute upon completion.
   */
  protected shutDownQueueConsumerGroupsHandler = (
    cb: ICallback<void>,
  ): void => {
    if (this.queueConsumerGroupsHandler) {
      this.queueConsumerGroupsHandler.shutdown(() => {
        this.queueConsumerGroupsHandler = null;
        cb();
      });
    } else cb();
  };

  /**
   * Initializes the Redis client.
   * @param {ICallback<void>} cb - Callback to execute upon completion.
   */
  protected initRedisClient = (cb: ICallback<void>): void =>
    this.redisClient.getSetInstance((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new CallbackEmptyReplyError());
      else {
        client.on('error', (err) => this.handleError(err));
        cb();
      }
    });

  /**
   * Defines the sequence of actions to take when the Producer is going up.
   * @returns {TUnaryFunction<ICallback<void>>[]} An array of functions to execute.
   */
  protected override goingUp(): TUnaryFunction<ICallback<void>>[] {
    return super.goingUp().concat([
      this.redisClient.init,
      this.eventBus.init,
      (cb: ICallback<void>) => {
        this.emit('producer.goingUp', this.id);
        cb();
      },
      this.initRedisClient,
      this.initQueueConsumerGroupsHandler,
    ]);
  }

  /**
   * Handles actions when the producer is successfully brought 'up'.
   * @param {ICallback<boolean>} cb - Callback to execute upon completion.
   */
  protected override up(cb: ICallback<boolean>) {
    super.up(() => {
      this.emit('producer.up', this.id);
      cb(null, true);
    });
  }

  /**
   * Defines the sequence of actions to take when the Producer is shutting down.
   * This method is responsible for shutting down the producer instance and its associated components.
   * It ensures that the producer instance is properly closed and that any event bus instances are also shut down.
   *
   * @returns {TUnaryFunction<ICallback<void>>[]} An array of functions to execute.
   */
  protected override goingDown(): TUnaryFunction<ICallback<void>>[] {
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
      this.emit('producer.down', this.id);
      setTimeout(() => this.eventBus.shutdown(() => cb(null, true)), 1000);
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
    if (!this.queueConsumerGroupsHandler)
      throw new PanicError(
        `Expected an instance of QueueConsumerGroupsHandler`,
      );
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
    const keys = redisKeys.getQueueKeys(
      message.getDestinationQueue(),
      message.getConsumerGroupId(),
    );
    const { keyMessage } = redisKeys.getMessageKeys(messageId);
    const scriptArgs = [
      EQueueProperty.QUEUE_TYPE,
      EQueueProperty.MESSAGES_COUNT,
      EQueueType.PRIORITY_QUEUE,
      EQueueType.LIFO_QUEUE,
      EQueueType.FIFO_QUEUE,
      message.producibleMessage.getPriority() ?? '',
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
        if (err) return cb(err);

        switch (reply) {
          case 'OK':
            return cb();
          case 'QUEUE_NOT_FOUND':
            return cb(new ProducerQueueNotFoundError());
          case 'MESSAGE_PRIORITY_REQUIRED':
            return cb(new ProducerMessagePriorityRequiredError());
          case 'PRIORITY_QUEUING_NOT_ENABLED':
            return cb(new ProducerPriorityQueuingNotEnabledError());
          case 'UNKNOWN_QUEUE_TYPE':
            return cb(new ProducerUnknownQueueTypeError());
          default:
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

    const handleResult: ICallback<void> = (err) => {
      if (err) {
        cb(err);
      } else {
        const action = message.isSchedulable() ? 'scheduled' : 'published';
        this.logger.info(`Message (ID ${messageId}) has been ${action}.`);
        if (!message.isSchedulable()) {
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
      _scheduleMessage(redisClient, message, handleResult);
    } else {
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
    const { exists, consumerGroups } =
      this.getQueueConsumerGroupsHandler().getConsumerGroups(queue);
    if (exists) {
      if (!consumerGroups.length) {
        cb(new ProducerQueueMissingConsumerGroupsError());
      }
      const ids: string[] = [];
      async.eachOf(
        consumerGroups,
        (group, _, done) => {
          const msg = new MessageEnvelope(message).setConsumerGroupId(group);
          this.produceMessageItem(redisClient, msg, queue, (err, reply) => {
            if (err) done(err);
            else {
              ids.push(String(reply));
              done();
            }
          });
        },
        (err) => {
          if (err) cb(err);
          else cb(null, ids);
        },
      );
    } else {
      const msg = new MessageEnvelope(message);
      this.produceMessageItem(redisClient, msg, queue, (err, reply) => {
        if (err) cb(err);
        else cb(null, [String(reply)]);
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
      return cb(new ProducerInstanceNotRunningError());
    }

    const redisClient = this.redisClient.getInstance();
    if (redisClient instanceof Error) {
      return cb(redisClient);
    }

    const exchangeParams = msg.getExchange();
    if (!exchangeParams) {
      return cb(new ProducerMessageExchangeRequiredError());
    }

    if (exchangeParams.type === EExchangeType.DIRECT) {
      const queue = exchangeParams.params;
      return this.produceMessage(redisClient, msg, queue, cb);
    }

    _getExchangeQueues(redisClient, exchangeParams, (err, queues) => {
      if (err) {
        return cb(err);
      }
      if (!queues?.length) {
        return cb(new ProducerExchangeNoMatchedQueueError());
      }

      const messages: string[] = [];
      async.eachOf(
        queues,
        (queue, index, done) => {
          this.produceMessage(redisClient, msg, queue, (err, reply) => {
            if (err) {
              return done(err);
            }
            if (reply) {
              messages.push(...reply);
            }
            done();
          });
        },
        (err) => {
          if (err) {
            return cb(err);
          }
          cb(null, messages);
        },
      );
    });
  }
}
